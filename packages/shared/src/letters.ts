import { z } from 'zod';

export const CreateLetterSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
});
export type CreateLetterInput = z.infer<typeof CreateLetterSchema>;
