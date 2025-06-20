// src/app/messages/[roomId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import TwoPanelChat from '@/components/TwoPanelChat';

export default function ChatRoomDeepLink() {
  const { roomId } = useParams<{ roomId: string }>();
  return <TwoPanelChat initialRoomId={roomId} />;
}
