export function calculateZoneOccupancyRate(occupiedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((occupiedCount / totalCount) * 100);
}
