'use client';

import { useParams } from 'next/navigation';
import TwoPanelChat from '@/components/TwoPanelChat';

export default function ChatRoomDeepLink() {
  const params = useParams(); // returns Record<string, string | string[]> | null
  const raw = params?.roomId;

  // normalize string|string[] → string
  const roomId =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
      ? raw[0]
      : '';

  return <TwoPanelChat initialRoomId={roomId} />;
}
