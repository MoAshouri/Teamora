export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId: string | null;
  mustSetPassword: boolean;
  emailVerified: boolean;
  mustVerifyEmail: boolean;
  pendingEmail: string | null;
};

export function verificationFlags(user: {
  role: 'ADMIN' | 'EMPLOYEE';
  emailVerifiedAt: Date | null;
  pendingEmail: string | null;
}): Pick<AuthUser, 'emailVerified' | 'mustVerifyEmail' | 'pendingEmail'> {
  const emailVerified = Boolean(user.emailVerifiedAt);
  return {
    emailVerified,
    mustVerifyEmail: user.role === 'ADMIN' && !user.emailVerifiedAt,
    pendingEmail: user.pendingEmail,
  };
}
