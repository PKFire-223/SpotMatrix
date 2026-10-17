import { WorkspaceNodeItem } from '../../../Shared/Types/GlobalSystemTypes';

export function recommendOptimalSeat(
  workspaceNodes: WorkspaceNodeItem[],
  requiredCapacity = 1
): WorkspaceNodeItem | null {
  const candidates = workspaceNodes
    .filter((node) => node.status === 'AVAILABLE' && node.capacityCount >= requiredCapacity)
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

  return candidates[0] || null;
}
