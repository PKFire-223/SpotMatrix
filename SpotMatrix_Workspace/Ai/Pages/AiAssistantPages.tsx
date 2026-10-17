import React from 'react';
import { WorkspaceNodeItem } from '../../Shared/Types/GlobalSystemTypes';
import { SmartSeatRecommender } from '../Function/Components/SmartSeatRecommender';
import { AiChatPanelLayout } from '../Layout/AiChatPanelLayout';

export const AiAssistantPages: React.FC<{
  workspaceNodes: WorkspaceNodeItem[];
  onApplyRecommendation: (nodeItem: WorkspaceNodeItem) => void;
}> = ({ workspaceNodes, onApplyRecommendation }) => {
  return (
    <AiChatPanelLayout>
      <SmartSeatRecommender
        workspaceNodes={workspaceNodes}
        onApplyRecommendation={onApplyRecommendation}
      />
    </AiChatPanelLayout>
  );
};
