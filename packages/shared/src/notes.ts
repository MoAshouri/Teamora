import { z } from 'zod';

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(8000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

export const ListNotesQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});
export type ListNotesQuery = z.infer<typeof ListNotesQuerySchema>;
