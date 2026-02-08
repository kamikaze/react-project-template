import config from "./config";
import type {APIPageResponse, UserProfile} from "./interfaces";
import {useAuth} from "./hook/useAuth.tsx";

export class BackendService {
  private static buildHeaders(token: string | null): HeadersInit {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  static async getUsers(queryParams: Record<string, string | number>): Promise<APIPageResponse<UserProfile>> {
    const { getAccessToken } = useAuth();
    const token = await getAccessToken();
    const query = new URLSearchParams(queryParams as Record<string, string>).toString();
    const response = await fetch(`${config.API_BASE_URL}/users?${query}`, {
      method: 'GET',
      headers: this.buildHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return response.json();
  }

  static async updateUser(name: string, status: string, note: string | null, estimate: string | null): Promise<void> {
    const payload = {status, note, estimate};
    const response = await fetch(`${config.API_BASE_URL}/users/${encodeURIComponent(name)}`, {
      credentials: 'include',
      method: 'PUT',
      headers: this.buildHeaders(null),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      const errorBody = await response.text();
      throw new Error(`Failed to save user for ${name}: ${response.status} - ${errorBody}`);
    }
  }
}
