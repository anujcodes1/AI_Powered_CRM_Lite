import {
  AuthResponse,
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  Deal,
  DealCreateInput,
  DealUpdateInput,
  Note,
  NoteCreateInput,
  ActivityLog,
  User,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(error.detail || `HTTP Error ${response.status}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

// Auth API
export async function signupUser(email: string, password: string, full_name?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User>(res);
}

// Contacts API
export async function fetchContacts(): Promise<Contact[]> {
  const res = await fetch(`${API_BASE_URL}/contacts`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Contact[]>(res);
}

export async function fetchContact(id: string): Promise<Contact> {
  const res = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Contact>(res);
}

export async function createContact(data: ContactCreateInput): Promise<Contact> {
  const res = await fetch(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Contact>(res);
}

export async function updateContact(id: string, data: ContactUpdateInput): Promise<Contact> {
  const res = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Contact>(res);
}

export async function deleteContact(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res);
}

export async function recalculateContactScore(contactId: string): Promise<{ lead_score: number; ai_score_reason: string }> {
  const res = await fetch(`${API_BASE_URL}/contacts/${contactId}/score`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ lead_score: number; ai_score_reason: string }>(res);
}

export async function generateDraftEmail(contactId: string): Promise<{ subject: string; body: string }> {
  const res = await fetch(`${API_BASE_URL}/contacts/${contactId}/draft-email`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ subject: string; body: string }>(res);
}

// AI Assistant Chat API
export async function sendChatMessage(message: string): Promise<{ answer: string; sources: string[] }> {
  const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  return handleResponse<{ answer: string; sources: string[] }>(res);
}

// Notes API
export async function fetchContactNotes(contactId: string): Promise<Note[]> {
  const res = await fetch(`${API_BASE_URL}/contacts/${contactId}/notes`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Note[]>(res);
}

export async function createContactNote(contactId: string, data: NoteCreateInput): Promise<Note> {
  const res = await fetch(`${API_BASE_URL}/contacts/${contactId}/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Note>(res);
}

// Activity Log API
export async function fetchContactActivities(contactId: string): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE_URL}/contacts/${contactId}/activities`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ActivityLog[]>(res);
}

// Deals API
export async function fetchDeals(): Promise<Deal[]> {
  const res = await fetch(`${API_BASE_URL}/deals`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Deal[]>(res);
}

export async function createDeal(data: DealCreateInput): Promise<Deal> {
  const res = await fetch(`${API_BASE_URL}/deals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Deal>(res);
}

export async function updateDeal(id: string, data: DealUpdateInput): Promise<Deal> {
  const res = await fetch(`${API_BASE_URL}/deals/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Deal>(res);
}

export async function deleteDeal(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/deals/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<void>(res);
}
