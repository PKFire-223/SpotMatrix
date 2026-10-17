export function validateBookingTimeWindow(startTimeIso: string, endTimeIso: string): boolean {
  return Boolean(startTimeIso && endTimeIso);
}
