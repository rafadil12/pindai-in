const CODE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export function sessionCodeFromScan(value: string): string | null {
  const upper = value.trim().toUpperCase();
  const fromPath = upper.match(/\/K\/([A-Z2-9]{6})(?=[^A-Z2-9]|$)/);
  if (fromPath && CODE.test(fromPath[1])) return fromPath[1];
  if (CODE.test(upper)) return upper;
  return null;
}
