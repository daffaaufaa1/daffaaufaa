export type UserRole = 'admin' | 'guru' | 'siswa';

export interface AppUser {
  id: string;
  identifier: string; // NIS untuk siswa, NIT untuk guru, username untuk admin
  role: UserRole;
  name: string;
  class_id?: string;
  class_name?: string;
  subject?: string; // untuk guru
}

export interface Student {
  id: string;
  nis: string;
  full_name: string;
  class_id: string | null;
  class_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  nit: string;
  full_name: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface ClassData {
  id: string;
  name: string;
  created_at: string;
}
