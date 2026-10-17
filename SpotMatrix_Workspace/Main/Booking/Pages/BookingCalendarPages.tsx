import React from 'react';
import { BookingPayloadItem } from '../../../Shared/Types/GlobalSystemTypes';
import { BookingFormModal } from '../Function/Components/BookingFormModal';
import { BookingSplitLayout } from '../Layout/BookingSplitLayout';

interface BookingCalendarPagesProps {
  bookingsList: BookingPayloadItem[];
  onCreateNewBooking: (userEmail: string, purposeNote: string) => void;
}

export const BookingCalendarPages: React.FC<BookingCalendarPagesProps> = ({
  bookingsList,
  onCreateNewBooking,
}) => {
  return (
    <BookingSplitLayout>
      <BookingFormModal bookingsList={bookingsList} onCreateNewBooking={onCreateNewBooking} />
    </BookingSplitLayout>
  );
};
