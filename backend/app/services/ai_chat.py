import json
import os
import urllib.request
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.models.deal import Deal
from app.models.note import Note
from app.models.activity_log import ActivityLog

SYSTEM_PROMPT_TEMPLATE = """You are an intelligent AI Assistant for "CRM Lite AI". Your job is to answer natural language questions about the user's contacts, sales pipeline, communication notes, and activity timeline based STRICTLY on the provided CRM Context Block.

STRICT ACCURACY RULES:
1. Answer ONLY using the facts explicitly stated in the CRM Context Block.
2. If the provided context does not contain enough information to answer the question, state: "I don't have enough information in your CRM data to answer that question."
3. Never invent or hallucinate contact emails, deal amounts, dates, or conversation details.
4. Keep your responses concise, professional, and well-structured using markdown lists or bold headers where helpful.

CURRENT UTC TIME: {current_time}

=== CRM CONTEXT BLOCK ===
{context_block}
========================="""


def build_user_crm_context(db: Session, user_id: str) -> str:
    """
    STRICT DATA ISOLATION: Retrieve contacts, deals, notes, and activities
    belonging ONLY to the specified user_id.
    """
    # 1. Fetch user contacts
    contacts = db.query(Contact).filter(Contact.user_id == user_id).order_by(Contact.name).all()
    
    # 2. Fetch user deals
    deals = db.query(Deal).filter(Deal.user_id == user_id).all()
    
    # 3. Fetch recent notes (last 30)
    notes = db.query(Note).filter(Note.user_id == user_id).order_by(Note.created_at.desc()).limit(30).all()
    
    # 4. Fetch recent activity logs (last 30)
    activities = db.query(ActivityLog).filter(ActivityLog.user_id == user_id).order_by(ActivityLog.timestamp.desc()).limit(30).all()

    # Build formatted markdown context block
    lines = []
    
    lines.append("### CONTACTS DIRECTORY")
    if not contacts:
        lines.append("No contacts recorded.")
    else:
        for c in contacts:
            score_str = f" [AI Lead Score: {c.lead_score}/100]" if c.lead_score is not None else ""
            reason_str = f" (Reason: {c.ai_score_reason})" if c.ai_score_reason else ""
            tags_str = f" | Tags: {', '.join(c.tags)}" if c.tags else ""
            lines.append(f"- Contact ID: {c.id} | Name: {c.name} | Email: {c.email} | Company: {c.company or 'N/A'}{score_str}{reason_str}{tags_str}")

    lines.append("\n### DEALS & SALES PIPELINE")
    if not deals:
        lines.append("No active deals.")
    else:
        for d in deals:
            updated_str = d.updated_at.strftime('%Y-%m-%d') if d.updated_at else 'N/A'
            contact_name = d.contact.name if d.contact else "Unknown Contact"
            lines.append(f"- Deal: '{d.title}' | Stage: {d.stage.value.upper()} | Value: ${d.value:,.2f} | Contact: {contact_name} (ID: {d.contact_id}) | Last Updated: {updated_str}")

    lines.append("\n### RECENT NOTES & COMMUNICATIONS")
    if not notes:
        lines.append("No notes recorded.")
    else:
        for n in notes:
            created_str = n.created_at.strftime('%Y-%m-%d %H:%M') if n.created_at else 'N/A'
            contact_name = n.contact.name if n.contact else f"Contact {n.contact_id}"
            lines.append(f"- [{created_str}] ({contact_name}): {n.content}")

    lines.append("\n### RECENT ACTIVITY TIMELINE")
    if not activities:
        lines.append("No activity logs recorded.")
    else:
        for a in activities:
            ts_str = a.timestamp.strftime('%Y-%m-%d %H:%M') if a.timestamp else 'N/A'
            lines.append(f"- [{ts_str}] [{a.type.value.upper()}]: {a.description}")

    return "\n".join(lines)


def generate_crm_assistant_answer(
    db: Session,
    user_id: str,
    user_question: str
) -> Dict[str, Any]:
    """Execute CRM RAG answer generation scoped to user_id."""
    # Build user-isolated context
    context_block = build_user_crm_context(db, user_id=user_id)
    current_time_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context_block=context_block, current_time=current_time_str)

    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")

    if not api_key:
        # Fallback keyword match answer if LLM key is omitted
        q_lower = user_question.lower()
        if "deal" in q_lower or "untouched" in q_lower or "stage" in q_lower:
            return {
                "answer": "Based on your active deals pipeline, you have active deals in various stages. To see deals needing attention, visit the Executive Dashboard or Deals Kanban board.",
                "sources": ["Deals Pipeline Context"]
            }
        return {
            "answer": f"Here is the context retrieved from your CRM workspace. (Add your `OPENAI_API_KEY` to `.env` to enable full natural language LLM reasoning over this context):\n\nQuestion: '{user_question}'\n\nActive Records Scoped to User: 100% Isolated.",
            "sources": ["CRM Database Context"]
        }

    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question}
            ],
            "temperature": 0.2,
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            answer = res_body["choices"][0]["message"]["content"]
            return {"answer": answer, "sources": ["Contacts", "Deals", "Notes", "ActivityLog"]}
    except Exception as e:
        print(f"CRM Chat Assistant error: {e}")
        return {
            "answer": "Sorry, I encountered an issue retrieving an answer from the AI service. Please check your API key and connection.",
            "sources": []
        }
