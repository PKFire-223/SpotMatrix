export function generateSessionToken(userId: string): string {
  return `TOKEN-${userId}-${Date.now()}`;
}
