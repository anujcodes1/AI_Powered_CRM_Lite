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

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://127.0.0.1:8000';
}

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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const error = await response.json().catch(() => ({ detail: 'API request failed' }));
    
    if (Array.isArray(error.detail)) {
      const messages = error.detail.map((errItem: { msg?: string; loc?: string[] }) => {
        const field = errItem.loc ? errItem.loc[errItem.loc.length - 1] : 'field';
        return `${field}: ${errItem.msg || 'invalid input'}`;
      });
      throw new Error(messages.join(', '));
    }
    
    throw new Error(error.detail || `HTTP Error ${response.status}`);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

async function safeFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  try {
    const res = await fetch(url, options);
    return await handleResponse<T>(res);
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend API server at ${baseUrl}. Please ensure FastAPI is running.`);
    }
    throw err;
  }
}

// Auth API
export async function signupUser(email: string, password: string, full_name?: string): Promise<AuthResponse> {
  return safeFetch<AuthResponse>(`/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return safeFetch<AuthResponse>(`/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(): Promise<User> {
  return safeFetch<User>(`/auth/me`, {
    headers: getAuthHeaders(),
  });
}

// Contacts API
export async function fetchContacts(): Promise<Contact[]> {
  return safeFetch<Contact[]>(`/contacts`, {
    headers: getAuthHeaders(),
  });
}

export async function fetchContact(id: string): Promise<Contact> {
  return safeFetch<Contact>(`/contacts/${id}`, {
    headers: getAuthHeaders(),
  });
}

export async function createContact(data: ContactCreateInput): Promise<Contact> {
  return safeFetch<Contact>(`/contacts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function updateContact(id: string, data: ContactUpdateInput): Promise<Contact> {
  return safeFetch<Contact>(`/contacts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id: string): Promise<void> {
  return safeFetch<void>(`/contacts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function recalculateContactScore(contactId: string): Promise<{ lead_score: number; ai_score_reason: string }> {
  return safeFetch<{ lead_score: number; ai_score_reason: string }>(`/contacts/${contactId}/score`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function generateDraftEmail(contactId: string): Promise<{ subject: string; body: string }> {
  return safeFetch<{ subject: string; body: string }>(`/contacts/${contactId}/draft-email`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

// AI Assistant Chat API
export async function sendChatMessage(message: string): Promise<{ answer: string; sources: string[] }> {
  return safeFetch<{ answer: string; sources: string[] }>(`/assistant/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
}

// Notes API
export async function fetchContactNotes(contactId: string): Promise<Note[]> {
  return safeFetch<Note[]>(`/contacts/${contactId}/notes`, {
    headers: getAuthHeaders(),
  });
}

export async function createContactNote(contactId: string, data: NoteCreateInput): Promise<Note> {
  return safeFetch<Note>(`/contacts/${contactId}/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

// Activity Log API
export async function fetchContactActivities(contactId: string): Promise<ActivityLog[]> {
  return safeFetch<ActivityLog[]>(`/contacts/${contactId}/activities`, {
    headers: getAuthHeaders(),
  });
}

// Deals API
export async function fetchDeals(): Promise<Deal[]> {
  return safeFetch<Deal[]>(`/deals`, {
    headers: getAuthHeaders(),
  });
}

export async function createDeal(data: DealCreateInput): Promise<Deal> {
  return safeFetch<Deal>(`/deals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function updateDeal(id: string, data: DealUpdateInput): Promise<Deal> {
  return safeFetch<Deal>(`/deals/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function deleteDeal(id: string): Promise<void> {
  return safeFetch<void>(`/deals/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}
