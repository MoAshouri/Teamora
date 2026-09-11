const TYPE_KEYS = {
  ANNUAL: 'leave.typeAnnual',
  SICK: 'leave.typeSick',
  UNPAID: 'leave.typeUnpaid',
  OTHER: 'leave.typeOther',
} as const;

export function leaveTypeMessageKey(type: string) {
  return TYPE_KEYS[type as keyof typeof TYPE_KEYS] ?? 'leave.type';
}
