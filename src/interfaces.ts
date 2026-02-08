export interface APIPageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface UserProfile {
  uid: string
  created_at: string
  updated_at: string | null
  name: string | null
  email: string | null
}

