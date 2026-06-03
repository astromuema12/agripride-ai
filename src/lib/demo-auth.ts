import { User, UserRole } from '@/types';

export const DEMO_ACCOUNTS: Record<string, { password: string; user: User }> = {
  'admin@agripride.ai': {
    password: 'Admin123!',
    user: {
      id: 'demo-admin-001',
      email: 'admin@agripride.ai',
      name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_suspended: false,
    },
  },
  'officer@agripride.ai': {
    password: 'Officer123!',
    user: {
      id: 'demo-officer-001',
      email: 'officer@agripride.ai',
      name: 'Jane Extension',
      role: 'officer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_suspended: false,
    },
  },
  'farmer@agripride.ai': {
    password: 'Farmer123!',
    user: {
      id: 'demo-farmer-001',
      email: 'farmer@agripride.ai',
      name: 'John Farmer',
      role: 'farmer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_suspended: false,
    },
  },
};

export function demoLogin(email: string, password: string): User | null {
  const account = DEMO_ACCOUNTS[email.toLowerCase()];
  if (account && account.password === password) {
    return { ...account.user };
  }
  return null;
}

export function demoRegister(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'farmer'
): User {
  return {
    id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email,
    name,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_suspended: false,
  };
}
