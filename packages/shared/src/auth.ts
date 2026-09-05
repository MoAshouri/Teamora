import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'EMPLOYEE']);
export type Role = z.infer<typeof RoleSchema>;

export const RegisterAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(32),
  fullName: z.string().min(2).max(120),
  companyName: z.string().min(2).max(120),
});
export type RegisterAdminInput = z.infer<typeof RegisterAdminSchema>;

export const LoginPasswordSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});
export type LoginPasswordInput = z.infer<typeof LoginPasswordSchema>;

export const RequestOtpSchema = z.object({
  email: z.string().email(),
});
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const JoinCompanySchema = z.object({
  inviteCode: z.string().length(6),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(32),
  fullName: z.string().min(2).max(120),
});
export type JoinCompanyInput = z.infer<typeof JoinCompanySchema>;
