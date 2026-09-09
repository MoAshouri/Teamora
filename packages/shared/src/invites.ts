import { z } from 'zod';

export const CreateInviteSchema = z.object({
  maxUses: z.number().int().min(1).max(1).optional().default(1),
  expiresInHours: z.number().int().min(1).max(3).optional().default(3),
});
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
