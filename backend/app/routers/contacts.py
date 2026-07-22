from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.contact import Contact
from app.models.note import Note
from app.models.activity_log import ActivityLog
from app.models.enums import ActivityType
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.schemas.note import NoteCreate, NoteResponse
from app.schemas.activity_log import ActivityLogResponse

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactResponse])
def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all contacts belonging to the logged-in user."""
    return db.query(Contact).filter(Contact.user_id == current_user.id).order_by(Contact.created_at.desc()).all()


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_in: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new contact scoped to the current user."""
    contact = Contact(
        user_id=current_user.id,
        name=contact_in.name,
        email=contact_in.email,
        phone=contact_in.phone,
        company=contact_in.company,
        tags=contact_in.tags
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        contact_id=contact.id,
        type=ActivityType.STATUS_CHANGE,
        description=f"Contact '{contact.name}' created."
    )
    db.add(log)
    db.commit()

    return contact


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch a single contact by ID if owned by the logged-in user."""
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: str,
    contact_in: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a contact's details."""
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    update_data = contact_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return None


@router.get("/{contact_id}/notes", response_model=List[NoteResponse])
def get_contact_notes(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all notes for a specific contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    return db.query(Note).filter(Note.contact_id == contact_id, Note.user_id == current_user.id).order_by(Note.created_at.desc()).all()


@router.post("/{contact_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_contact_note(
    contact_id: str,
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new note to a contact and log the activity."""
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    note = Note(
        user_id=current_user.id,
        contact_id=contact_id,
        content=note_in.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # Log corresponding activity
    activity = ActivityLog(
        user_id=current_user.id,
        contact_id=contact_id,
        type=ActivityType.CALL if "call" in note_in.content.lower() else ActivityType.EMAIL if "email" in note_in.content.lower() else ActivityType.MEETING if "meeting" in note_in.content.lower() else ActivityType.STATUS_CHANGE,
        description=f"Note added: {note_in.content[:60]}..."
    )
    db.add(activity)
    db.commit()

    return note


@router.get("/{contact_id}/activities", response_model=List[ActivityLogResponse])
def get_contact_activities(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch activity history for a specific contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    return db.query(ActivityLog).filter(ActivityLog.contact_id == contact_id, ActivityLog.user_id == current_user.id).order_by(ActivityLog.timestamp.desc()).all()
