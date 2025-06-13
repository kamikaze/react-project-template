import config from "./config";
import type {APIPageResponse, UserItem} from "./interfaces";

export class BackendService {
  private static buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  static async getUsers(queryParams: Record<string, string | number>): Promise<APIPageResponse<UserItem>> {
    const query = new URLSearchParams(queryParams as Record<string, string>).toString();
    const response = await fetch(`${config.API_BASE_URL}/users?${query}`, {
      method: 'GET',
      headers: this.buildHeaders(),
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
