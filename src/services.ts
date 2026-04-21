import config from "./config";
import type {APIPageResponse, UserProfile} from "./interfaces";
import {buildHeaders} from "./auth";

export class BackendService {
  static async getUsers(queryParams: Record<string, string | number>, token: string | null = null): Promise<APIPageResponse<UserProfile>> {
    const query = new URLSearchParams(queryParams as Record<string, string>).toString();
    const response = await fetch(`${config.API_BASE_URL}/users?${query}`, {
      method: 'GET',
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return response.json();
  }
}
