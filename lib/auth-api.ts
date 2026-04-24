const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://ljtwsbvd8l.execute-api.ap-southeast-2.amazonaws.com/prod";

const AUTH_PROFILE = `${API_BASE_URL}/ese/v1/auth/profile`;
const AUTH_PASSWORD = `${API_BASE_URL}/ese/v1/auth/password`;
import { fetchAuthSession } from "aws-amplify/auth";

export interface UserProfile {
  username: string;
  email: string;
  company_name?: string;
}
export async function fetchUserProfile(): Promise<UserProfile> {
  return fetchJson(`${AUTH_PROFILE}`, {
    method: "GET",
  });
}

export async function updateUserProfile(data: {
  username?: string;
  email?: string;
  company_name?: string;
}): Promise<UserProfile> {
  return fetchJson(`${AUTH_PROFILE}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
export async function changePassword(data: {
  current_password: string;
  new_password: string;
}) {
  return fetchJson(`${AUTH_PASSWORD}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const rawBody = await response.text();
  let parsedBody: any = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      parsedBody?.error || rawBody || `Request failed (${response.status})`,
    );
  }

  return parsedBody as T;
}
