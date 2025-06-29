// src/app/messages/[roomId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import TwoPanelChat from '@/components/TwoPanelChat';

export default function ChatRoomDeepLink() {
  // useParams can return null during the very first render on the server
  // so we handle that case gracefully.
  const params = useParams<{ roomId: string }>() ?? undefined;
  const roomId = params?.roomId;

  if (!roomId) {
    // Could render a fallback UI or null while the router is resolving
    return null;
  }

  return <TwoPanelChat initialRoomId={roomId} />;
}
