export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface UserProfile {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
