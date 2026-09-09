import { z } from 'zod';

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = CreateNoteSchema.partial();
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
