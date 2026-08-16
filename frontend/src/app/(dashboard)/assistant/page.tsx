'use client';

import React from 'react';
import GeminiAssistantDrawer from '@/components/ai/GeminiAssistantDrawer';

export default function AssistantPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <GeminiAssistantDrawer />
    </div>
  );
}
