export interface APIPageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface UserItem {
  id: string
  created_at: string
  updated_at: string | null
  username: string
  team: string
}

