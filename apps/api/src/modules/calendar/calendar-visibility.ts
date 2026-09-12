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

export function employeeCanSeeEvent(
  event: { creatorId: string; attendees: Array<{ userId: string }> },
  userId: string,
): boolean {
  if (event.attendees.length === 0) return true;
  if (event.creatorId === userId) return true;
  return event.attendees.some((row) => row.userId === userId);
}
