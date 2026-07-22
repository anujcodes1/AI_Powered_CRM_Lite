from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_chat import generate_crm_assistant_answer

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
def chat_with_crm_assistant(
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    RAG AI Endpoint: Answer user natural language queries over CRM data.
    
    SECURITY ISOLATION:
    Data retrieval inside generate_crm_assistant_answer is strictly filtered
    by `user_id = current_user.id` across all Contacts, Deals, Notes, and ActivityLogs.
    """
    result = generate_crm_assistant_answer(
        db=db,
        user_id=current_user.id,  # STRICT SINGLE-TENANT USER SCOPING
        user_question=chat_in.message
    )
    return ChatResponse(answer=result["answer"], sources=result.get("sources", []))
