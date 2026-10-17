import React, { ReactNode } from 'react';

interface FloorplanCanvasLayoutProps {
  mapViewportSlot: ReactNode;
  sideControlSlot: ReactNode;
}

export const FloorplanCanvasLayout: React.FC<FloorplanCanvasLayoutProps> = ({
  mapViewportSlot,
  sideControlSlot,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      <div className="lg:col-span-8 flex flex-col gap-4">{mapViewportSlot}</div>
      <div className="lg:col-span-4 flex flex-col gap-4">{sideControlSlot}</div>
    </div>
  );
};
