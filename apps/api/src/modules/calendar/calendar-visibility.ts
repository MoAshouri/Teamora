export function companyMemberIds(company: {
  adminId: string | null;
  memberships: Array<{ userId: string }>;
}): Set<string> {
  return new Set<string>([
    ...(company.adminId ? [company.adminId] : []),
    ...company.memberships.map((row) => row.userId),
  ]);
}

export function inCompanyAttendees<T extends { userId: string }>(
  attendees: T[],
  inCompany: Set<string>,
): T[] {
  return attendees.filter((row) => inCompany.has(row.userId));
}

export function isCompanyWideMeeting(localAttendeeCount: number, rawAttendeeCount: number) {
  return localAttendeeCount === 0 && rawAttendeeCount === 0;
}

export function employeeCanSeeEvent(
  event: { creatorId: string; attendees: Array<{ userId: string }> },
  userId: string,
  rawAttendeeCount = event.attendees.length,
): boolean {
  if (isCompanyWideMeeting(event.attendees.length, rawAttendeeCount)) return true;
  if (event.creatorId === userId) return true;
  return event.attendees.some((row) => row.userId === userId);
}
