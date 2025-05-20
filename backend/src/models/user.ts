export interface user {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export const users: user[] = [];
