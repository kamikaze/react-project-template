import config from "./config";
import type {APIPageResponse, UserProfile} from "./interfaces";

export class BackendService {
  private static buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  static async getUsers(queryParams: Record<string, string | number>, token: string | null = null): Promise<APIPageResponse<UserProfile>> {
    const query = new URLSearchParams(queryParams as Record<string, string>).toString();

    // If token is provided (e.g. from loader), we use it.
    // Otherwise the fetch patch in AuthProvider will inject it.
    const headers = this.buildHeaders() as Record<string, string>;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${config.API_BASE_URL}/users?${query}`, {
      method: 'GET',
      headers,
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
      method: 'PUT',
      headers: this.buildHeaders(),
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
