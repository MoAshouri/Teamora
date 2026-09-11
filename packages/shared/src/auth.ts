import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'EMPLOYEE']);
export type Role = z.infer<typeof RoleSchema>;

export const RegisterAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120),
  companyName: z.string().min(2).max(120),
});
export type RegisterAdminInput = z.infer<typeof RegisterAdminSchema>;

export const LoginPasswordSchema = z.object({
  email: z.string().email(),
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
  fullName: z.string().min(2).max(120),
});
export type JoinCompanyInput = z.infer<typeof JoinCompanySchema>;

export const SetPasswordSchema = z.object({
  password: z.string().min(8),
});
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  avatarUrl: z
    .union([z.string().url().max(2048), z.literal(''), z.null()])
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email(),
});
export type ChangeEmailInput = z.infer<typeof ChangeEmailSchema>;

export const ConfirmEmailVerifySchema = z.object({
  code: z.string().length(6),
});
export type ConfirmEmailVerifyInput = z.infer<typeof ConfirmEmailVerifySchema>;

export const ConfirmEmailChangeSchema = z.object({
  newEmail: z.string().email(),
  code: z.string().length(6),
});
export type ConfirmEmailChangeInput = z.infer<typeof ConfirmEmailChangeSchema>;
