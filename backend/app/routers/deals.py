from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.activity_log import ActivityLog
from app.models.enums import ActivityType
from app.schemas.deal import DealCreate, DealUpdate, DealResponse

router = APIRouter(prefix="/deals", tags=["Deals"])


@router.get("", response_model=List[DealResponse])
def get_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all deals belonging to the logged-in user with contact info."""
    return db.query(Deal).filter(Deal.user_id == current_user.id).order_by(Deal.created_at.desc()).all()


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    deal_in: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new deal for a user contact."""
    contact = db.query(Contact).filter(Contact.id == deal_in.contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    deal = Deal(
        user_id=current_user.id,
        contact_id=deal_in.contact_id,
        title=deal_in.title,
        stage=deal_in.stage,
        value=deal_in.value
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)

    # Log activity on contact timeline
    activity = ActivityLog(
        user_id=current_user.id,
        contact_id=contact.id,
        type=ActivityType.STATUS_CHANGE,
        description=f"New deal created: '{deal.title}' (${deal.value:,.2f}) in stage '{deal.stage.value}'."
    )
    db.add(activity)
    db.commit()

    return deal


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get deal details."""
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == current_user.id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    return deal


@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    deal_in: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update deal details or move Kanban stage."""
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == current_user.id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")

    old_stage = deal.stage
    update_data = deal_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(deal, field, value)

    db.commit()
    db.refresh(deal)

    # Log activity if stage changed
    if deal_in.stage and deal_in.stage != old_stage:
        activity = ActivityLog(
            user_id=current_user.id,
            contact_id=deal.contact_id,
            type=ActivityType.STATUS_CHANGE,
            description=f"Deal '{deal.title}' stage moved from '{old_stage.value}' to '{deal.stage.value}'."
        )
        db.add(activity)
        db.commit()

    return deal


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a deal."""
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == current_user.id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")

    db.delete(deal)
    db.commit()
    return None
