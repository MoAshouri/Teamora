import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';

function asDay(value: string) {
  const text = String(value).slice(0, 10);
  return new Date(`${text}T00:00:00.000Z`);
}

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(note: { id: string; title: string; body: string; date: Date }) {
    return {
      id: note.id,
      title: note.title,
      body: note.body,
      date: isoDay(note.date),
    };
  }

  async list(companyId: string, query: ListNotesQuery) {
    const from = asDay(query.from);
    const to = asDay(query.to);
    const notes = await this.prisma.note.findMany({
      where: {
        companyId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'asc' },
    });
    return notes.map((note) => this.map(note));
  }

  async create(companyId: string, creatorId: string, input: CreateNoteInput) {
    const note = await this.prisma.note.create({
      data: {
        companyId,
        creatorId,
        title: input.title,
        body: input.body,
        date: asDay(input.date),
      },
    });
    return this.map(note);
  }

  async update(companyId: string, id: string, input: UpdateNoteInput) {
    const existing = await this.prisma.note.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Note not found');
    const note = await this.prisma.note.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.body != null ? { body: input.body } : {}),
        ...(input.date ? { date: asDay(input.date) } : {}),
      },
    });
    return this.map(note);
  }

  async delete(companyId: string, id: string) {
    const existing = await this.prisma.note.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Note not found');
    await this.prisma.note.delete({ where: { id } });
  }
}
