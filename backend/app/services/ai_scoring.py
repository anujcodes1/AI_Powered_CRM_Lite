import json
import os
import re
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error

SYSTEM_PROMPT = """You are an expert B2B sales intelligence assistant. Your task is to evaluate a sales lead's engagement based on CRM activity recency, deal pipeline stage, and recent communication notes.
Calculate an objective lead score between 0 and 100 using these guidelines:
- Active recency (< 7 days) & advanced deal stage (proposal/won): 75-100
- Moderate activity (7-30 days) or discovery stage (contacted/lead): 40-74
- Inactive/stale activity (> 30 days) or lost stage: 0-39

CRITICAL: You MUST output ONLY raw valid JSON adhering strictly to this schema:
{"score": <int 0-100>, "reason": "<one concise sentence justification>"}
Do not include markdown code block syntax (like ```json), commentary, or extra keys."""


def generate_lead_score_prompt(
    name: str,
    company: Optional[str],
    deal_stage: str,
    days_since_last_activity: int,
    recent_notes: List[str]
) -> str:
    """Format lightweight (<300 tokens) prompt context."""
    notes_text = "\n".join([f"- {note}" for note in recent_notes[:5]]) if recent_notes else "No notes recorded."
    
    return f"""Contact Name: {name}
Company: {company or 'N/A'}
Current Deal Stage: {deal_stage}
Activity Recency: {days_since_last_activity} day(s) ago
Recent Notes (last 5):
{notes_text}

Evaluate this lead and return the JSON score and reason."""


def parse_llm_json_response(raw_response: str) -> Dict[str, Any]:
    """Robust JSON parser that strips code block wrappers or extracts JSON substrings."""
    cleaned = raw_response.strip()
    # Strip markdown ```json ... ``` code blocks if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()
        
    try:
        data = json.loads(cleaned)
        score = int(data.get("score", 50))
        # Ensure score is strictly bounded between 0 and 100
        score = max(0, min(100, score))
        reason = str(data.get("reason", "Lead score calculated based on recent interaction and deal stage.")).strip()
        return {"score": score, "reason": reason}
    except Exception:
        # Regex fallback lookup if JSON parsing fails
        score_match = re.search(r'"score"\s*:\s*(\d+)', raw_response)
        reason_match = re.search(r'"reason"\s*:\s*"([^"]+)"', raw_response)
        
        score = int(score_match.group(1)) if score_match else 50
        reason = reason_match.group(1) if reason_match else "Lead score evaluated based on engagement signals."
        return {"score": max(0, min(100, score)), "reason": reason}


def compute_heuristic_fallback(
    deal_stage: str,
    days_since_last_activity: int,
    recent_notes: List[str]
) -> Dict[str, Any]:
    """Fast, deterministic fallback calculator when LLM API keys are omitted."""
    base_score = 50
    
    # Stage weight
    stage_weights = {
        "lead": 10,
        "contacted": 20,
        "proposal": 35,
        "won": 45,
        "lost": -40
    }
    base_score += stage_weights.get(deal_stage.lower(), 10)
    
    # Recency penalty / bonus
    if days_since_last_activity <= 3:
        base_score += 15
    elif days_since_last_activity <= 14:
        base_score += 5
    elif days_since_last_activity > 30:
        base_score -= 25
        
    # Notes count bonus
    base_score += min(len(recent_notes) * 4, 15)
    
    final_score = max(5, min(98, base_score))
    
    reason = f"Lead score ({final_score}/100) based on '{deal_stage}' stage, {days_since_last_activity}d recency, and {len(recent_notes)} recent notes."
    return {"score": final_score, "reason": reason}


def calculate_ai_lead_score(
    name: str,
    company: Optional[str],
    deal_stage: str,
    days_since_last_activity: int,
    recent_notes: List[str]
) -> Dict[str, Any]:
    """Orchestrate LLM lead scoring with OpenAI/Gemini or fallback heuristic parser."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
    user_prompt = generate_lead_score_prompt(name, company, deal_stage, days_since_last_activity, recent_notes)

    if not api_key:
        return compute_heuristic_fallback(deal_stage, days_since_last_activity, recent_notes)

    try:
        # Call OpenAI Chat Completion REST API via standard library if key is available
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
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            content = res_body["choices"][0]["message"]["content"]
            return parse_llm_json_response(content)
    except Exception as e:
        print(f"LLM API call failed, using fallback parser: {e}")
        return compute_heuristic_fallback(deal_stage, days_since_last_activity, recent_notes)
