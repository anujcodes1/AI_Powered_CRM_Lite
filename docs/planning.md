# CRM Lite AI — Product & Architecture Blueprint

## 1. Problem Statement
Solo founders and small sales teams often struggle with bloated, expensive CRMs that require heavy manual data entry and lack actionable intelligence out of the box. They need a simple, lightweight system that manages contacts and deal pipelines while using AI to reduce manual effort—automatically prioritizing leads, drafting personalized follow-up emails, and allowing instant natural-language queries over their CRM data.

## 2. Application Overview
CRM Lite AI is a streamlined, full-stack Customer Relationship Management platform designed specifically for solo founders and micro-teams. Built with Next.js 14 on the frontend and FastAPI with PostgreSQL on the backend, the application delivers core pipeline management (Contacts, Kanban Deals, Activity Logs) enhanced by three focused AI capabilities. Using LLM integrations and vector search/RAG, CRM Lite AI automatically calculates engagement lead scores, generates context-aware follow-up email drafts based on contact activity history, and provides an interactive natural-language chat assistant for querying workspace data.

## 3. Features List

### Core CRM Features
- **User Authentication (MVP):** JWT-based signup and login with password hashing (`passlib`/`bcrypt`). Single-user workspace data isolation.
- **Contacts CRUD (MVP):** Full management of contacts (Name, Email, Phone, Company, Tags, Notes, Status).
- **Deals / Pipeline Kanban (MVP):** Visual stage pipeline (*Lead* → *Contacted* → *Proposal* → *Won* / *Lost*) with stage transition actions.
- **Activity Log & Notes Timeline (MVP):** Log calls, emails, meetings, and notes per contact in a chronological activity feed.

### AI Features
- **AI Lead Scoring (MVP):** Automated LLM endpoint that evaluates activity recency, note count, and deal stage to calculate an engagement score (0–100) with a brief justification snippet.
- **AI Email Draft Generator (MVP):** Context-aware prompt engine that inspects a contact's history and stage to generate personalized follow-up email drafts.
- **AI Natural Language CRM Chat Assistant (MVP):** RAG and structured query assistant that answers natural-language questions over CRM data (e.g. *"Which deals haven't been touched in 2 weeks?"*).

### Stretch / Nice-to-Have Features
- **Global Search & Filter (Stretch):** Fast full-text search across contacts, deals, and notes.
- **Email Send Integration (Stretch):** One-click sending of generated drafts via Resend/SendGrid API.
- **CSV Export/Import (Stretch):** Import/export contacts via CSV format.

## 4. Technical Architecture

### Component Breakdown
- **Frontend (Next.js 14 App Router + TypeScript + Tailwind CSS):** Single Page Application rendering UI, handling client state, and communicating with FastAPI REST endpoints via Axios/Fetch with JWT authorization headers.
- **Backend (FastAPI + SQLAlchemy 2.0):** Exposes RESTful API routes, validates payload schemas using Pydantic, executes DB queries via SQLAlchemy, and coordinates AI service invocations.
- **Database (PostgreSQL + `pgvector`):** Relational persistence for users, contacts, deals, and notes, with vector extensions enabled for storing embedding vectors of notes/activities for RAG search.
- **AI Layer (OpenAI API / Gemini API):** Service layer executing structured JSON extraction for lead scoring, contextual generation for email drafts, and embedding retrieval for CRM chat queries.

### Architecture Diagram
```text
+-----------------------------------------------------------------------+
|                            Client Browser                             |
|              Next.js 14 (App Router, Tailwind, TypeScript)            |
+----------------------------------+------------------------------------+
                                   |
                             REST / HTTP (JWT)
                                   |
+----------------------------------v------------------------------------+
|                         FastAPI Backend App                           |
|  +------------------+  +-------------------+  +--------------------+  |
|  | Auth & User Deps |  | CRUD Routers      |  | AI Service Layer   |  |
|  | (PyJWT / Passlib)|  | (Contacts/Deals)  |  | (Prompts & RAG)    |  |
|  +--------+---------+  +---------+---------+  +---------+----------+  |
+-----------|----------------------|----------------------|-------------+
            |                      |                      |
            v                      v                      v
+-------------------------------------+  +------------------------------+
|       PostgreSQL Database           |  |      LLM Service API         |
|  (Users, Contacts, Deals, Notes,    |  |  (OpenAI GPT-4o-mini /       |
|   ActivityLog + pgvector for RAG)   |  |   Gemini 1.5 Flash)          |
+-------------------------------------+  +------------------------------+
```

## 5. Database Design

### Entities & Relationships

1. **`users`**
   - `id` (UUID / Integer, Primary Key)
   - `email` (String, Unique, Indexed)
   - `hashed_password` (String)
   - `full_name` (String)
   - `created_at` (Timestamp UTC)

2. **`contacts`**
   - `id` (UUID / Integer, Primary Key)
   - `user_id` (Foreign Key -> `users.id`, Indexed)
   - `first_name` (String)
   - `last_name` (String)
   - `email` (String, Indexed)
   - `phone` (String, Nullable)
   - `company` (String, Nullable)
   - `tags` (JSONB / Array of Strings)
   - `ai_lead_score` (Integer, Nullable, Default: 0)
   - `ai_score_reason` (Text, Nullable)
   - `created_at` (Timestamp UTC)
   - `updated_at` (Timestamp UTC)

3. **`deals`**
   - `id` (UUID / Integer, Primary Key)
   - `user_id` (Foreign Key -> `users.id`, Indexed)
   - `contact_id` (Foreign Key -> `contacts.id`, Indexed)
   - `title` (String)
   - `value` (Numeric/Float, Default: 0.0)
   - `stage` (Enum: `LEAD`, `CONTACTED`, `PROPOSAL`, `WON`, `LOST`)
   - `expected_close_date` (Date, Nullable)
   - `created_at` (Timestamp UTC)
   - `updated_at` (Timestamp UTC)

4. **`notes`**
   - `id` (UUID / Integer, Primary Key)
   - `user_id` (Foreign Key -> `users.id`, Indexed)
   - `contact_id` (Foreign Key -> `contacts.id`, Indexed)
   - `content` (Text)
   - `note_type` (Enum: `NOTE`, `CALL`, `EMAIL`, `MEETING`)
   - `embedding` (Vector, Nullable - for pgvector RAG)
   - `created_at` (Timestamp UTC)

5. **`activity_logs`**
   - `id` (UUID / Integer, Primary Key)
   - `user_id` (Foreign Key -> `users.id`, Indexed)
   - `contact_id` (Foreign Key -> `contacts.id`, Nullable)
   - `deal_id` (Foreign Key -> `deals.id`, Nullable)
   - `action` (String, e.g. "STAGE_CHANGE", "SCORE_UPDATED", "NOTE_ADDED")
   - `description` (Text)
   - `created_at` (Timestamp UTC)

## 6. Development Milestones

1. **Milestone 1: Repository & DB Setup**
   - Configure PostgreSQL, SQLAlchemy async engine, and Alembic migrations for all 5 core tables.
   - Verify DB connection and test initial migration.

2. **Milestone 2: Auth System & User Scope**
   - Implement JWT auth endpoints (`/auth/signup`, `/auth/login`, `/auth/me`) in FastAPI.
   - Create Next.js auth state / token handling and login/signup forms.

3. **Milestone 3: Contacts CRUD & UI**
   - FastAPI REST endpoints for Contacts (`GET`, `POST`, `PUT`, `DELETE`).
   - Next.js Contacts table view, search filter, and contact detail drawer/page.

4. **Milestone 4: Deals Kanban Board**
   - FastAPI REST endpoints for Deals (`GET`, `POST`, `PATCH /stage`).
   - Next.js Kanban Board UI with stage movement options.

5. **Milestone 5: Activity Log & Notes Timeline**
   - Backend routes for creating notes/activities per contact and listing chronological timeline.
   - Frontend activity feed component on contact detail view.

6. **Milestone 6: AI Lead Scoring Engine**
   - Backend service integrating LLM API to compute 0–100 score + explanation based on notes recency & deal stage.
   - Frontend score badge display with explanation popup.

7. **Milestone 7: AI Email Draft Generator**
   - FastAPI endpoint `/ai/email-draft` assembling contact profile & timeline context to generate tailored email drafts.
   - Next.js modal component for "Generate Email Draft" with copy-to-clipboard functionality.

8. **Milestone 8: AI Chat Assistant (RAG over CRM Data)**
   - Backend service converting CRM queries into structured DB lookup / vector retrieval over notes.
   - Floating AI Chat assistant widget in Next.js frontend.

9. **Milestone 9: Integration, Polishing & E2E Testing**
   - Connect all frontend pages with backend endpoints, add toast notifications, error boundaries, and loading skeletons.
   - Complete manual flow verification and smoke tests.
