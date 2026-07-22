import json
import os
import re
from typing import Dict, Any, List, Optional
import urllib.request

SYSTEM_PROMPT = """You are an elite executive communications assistant specializing in concise, high-converting B2B sales follow-up emails.
Your goal is to write a short, authentic, highly relevant email based on a contact's profile, deal stage, and recent activity notes.

STRICT TONE & STYLE RULES:
1. NEVER use cliché filler phrases like "I hope this email finds you well," "Per my last email," "Checking in," or "Hope you're having a great week."
2. Write like a human executive talking to another professional—clear, respectful, direct, and zero fluff.
3. Adapt the call-to-action (CTA) tone based on the deal stage:
   - 'lead' / 'contacted': Discovery-oriented, low pressure, asking open-ended questions.
   - 'proposal': Direct ask, addressing specific requirements or decision timeline.
   - 'won' / 'lost': Partnership check-in or polite closure loop.
4. Keep the email body length concise (under 100 words).

FEW-SHOT EXAMPLE:
User Context:
Contact Name: Marcus Vance
Company: Apex Logistics
Current Deal Stage: proposal
Recent Notes:
- Marcus requested pricing breakdown for 50 driver seats.
- Mentioned decision timeline is end of Q3.

Expected JSON Output:
{
  "subject": "Proposal details for Apex Logistics (50 seats)",
  "body": "Hi Marcus,\n\nFollowing up on our conversation regarding the 50-seat team expansion. I've finalized the custom proposal breakdown incorporating the custom SLA terms we discussed.\n\nDo you have 10 minutes this Thursday afternoon to review the numbers before your Q3 budget freeze?\n\nBest,\n[Your Name]"
}

OUTPUT FORMAT:
Respond strictly with valid raw JSON adhering to this schema:
{"subject": "<email subject line>", "body": "<email body content>"}
No markdown wrappers (like ```json), code blocks, or extra text."""


def generate_email_prompt(
    name: str,
    company: Optional[str],
    deal_stage: str,
    recent_notes: List[str]
) -> str:
    """Format lightweight prompt context."""
    notes_text = "\n".join([f"- {note}" for note in recent_notes[:5]]) if recent_notes else "No notes recorded."
    
    return f"""Contact Name: {name}
Company: {company or 'N/A'}
Current Deal Stage: {deal_stage}
Recent Notes (last 5):
{notes_text}

Generate a tailored follow-up email (subject and body) in JSON format."""


def parse_email_json_response(raw_response: str) -> Dict[str, str]:
    """Parse JSON email draft response safely."""
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```$", "", cleaned).strip()
        
    try:
        data = json.loads(cleaned)
        subject = str(data.get("subject", "Following up")).strip()
        body = str(data.get("body", "")).strip()
        return {"subject": subject, "body": body}
    except Exception:
        subj_match = re.search(r'"subject"\s*:\s*"([^"]+)"', raw_response)
        body_match = re.search(r'"body"\s*:\s*"([^"]+)"', raw_response)
        
        subject = subj_match.group(1) if subj_match else "Follow-up conversation"
        body = body_match.group(1).replace("\\n", "\n") if body_match else f"Hi {name},\n\nFollowing up on our recent notes."
        return {"subject": subject, "body": body}


def compute_fallback_email_draft(
    name: str,
    company: Optional[str],
    deal_stage: str,
    recent_notes: List[str]
) -> Dict[str, str]:
    """Deterministic fallback email draft generator when LLM API keys are omitted."""
    first_name = name.split()[0]
    comp_str = f" for {company}" if company else ""
    
    if deal_stage.lower() == "proposal":
        subject = f"Next steps on proposal{comp_str}"
        body = f"Hi {first_name},\n\nFollowing up on the proposal details we discussed recently. I wanted to see if you had any questions regarding the terms or scope before finalizing the next steps.\n\nDo you have 10 minutes for a brief call this week?\n\nBest,\n[Your Name]"
    elif deal_stage.lower() in ["contacted", "lead"]:
        subject = f"Quick question regarding {company or 'your team'}"
        body = f"Hi {first_name},\n\nI was reviewing our recent notes regarding {company or 'your workspace'} and wanted to see how your team is managing current priorities.\n\nWould you be open to a quick 10-minute introduction call next Tuesday?\n\nBest,\n[Your Name]"
    else:
        subject = f"Reconnecting{comp_str}"
        body = f"Hi {first_name},\n\nReaching out to see how things are progressing on your end following our earlier conversations.\n\nLet me know if there's any context I can provide.\n\nBest,\n[Your Name]"
        
    return {"subject": subject, "body": body}


def generate_ai_email_draft(
    name: str,
    company: Optional[str],
    deal_stage: str,
    recent_notes: List[str]
) -> Dict[str, str]:
    """Orchestrate LLM email draft generation."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
    user_prompt = generate_email_prompt(name, company, deal_stage, recent_notes)

    if not api_key:
        return compute_fallback_email_draft(name, company, deal_stage, recent_notes)

    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            content = res_body["choices"][0]["message"]["content"]
            return parse_email_json_response(content)
    except Exception as e:
        print(f"LLM Email generation failed, using fallback draft: {e}")
        return compute_fallback_email_draft(name, company, deal_stage, recent_notes)
