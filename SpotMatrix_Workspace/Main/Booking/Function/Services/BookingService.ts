import { BookingPayloadItem } from '../../../../Shared/Types/GlobalSystemTypes';
import { updateWorkspaceNodeStatus } from '../../../Floorplan/Function/Services/FloorplanService';
import { createConflictException } from '../../../../Error/Function/Models/AppExceptionModel';

const inMemoryBookings: BookingPayloadItem[] = [
  {
    bookingId: 'BK-2026-001',
    nodeId: 'NODE-F01',
    userEmail: 'architect.lead@smartspace.vn',
    startTimeIso: '2026-10-18T09:00',
    endTimeIso: '2026-10-18T11:30',
    purposeNote: 'Review Kiến trúc Hệ thống 3D Floorplan',
    bookingStatus: 'CONFIRMED',
  },
];

export async function listAllWorkspaceBookings(): Promise<BookingPayloadItem[]> {
  return inMemoryBookings;
}

export async function createWorkspaceBooking(
  nodeId: string,
  userEmail: string,
  startTimeIso: string,
  endTimeIso: string,
  purposeNote: string
): Promise<BookingPayloadItem> {
  const existingActive = inMemoryBookings.find(
    (item) => item.nodeId === nodeId && item.bookingStatus !== 'CANCELLED'
  );
  if (existingActive) {
    throw createConflictException(`Vi tri ${nodeId} da co lich dat truoc, vui long chon ban khac.`);
  }

  const createdRecord: BookingPayloadItem = {
    bookingId: `BK-${Date.now().toString().slice(-5)}`,
    nodeId,
    userEmail,
    startTimeIso,
    endTimeIso,
    purposeNote,
    bookingStatus: 'CONFIRMED',
  };

  inMemoryBookings.unshift(createdRecord);
  await updateWorkspaceNodeStatus(nodeId, 'RESERVED');
  return createdRecord;
}
