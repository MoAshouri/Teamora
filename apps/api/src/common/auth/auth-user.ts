export type AuthUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId: string | null;
};
