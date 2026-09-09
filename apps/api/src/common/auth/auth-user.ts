export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId: string | null;
  mustSetPassword: boolean;
};
