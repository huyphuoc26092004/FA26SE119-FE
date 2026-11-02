import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';

/**
 * Nghe tin nhắn mới của một cuộc tư vấn qua SSE (GET /consultations/{id}/events).
 * EventSource không gửi được header, nên token đi qua `?access_token=` (backend chỉ nhận ở endpoint này).
 * Trả về true khi đang kết nối; trang vẫn nên giữ polling chậm làm dự phòng.
 */
export function useConsultationEvents(threadId: string, onMessage: () => void): boolean {
  const token = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    if (!threadId || !token || typeof EventSource === 'undefined') return;
    const base = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    const source = new EventSource(`${base}/consultations/${threadId}/events?access_token=${encodeURIComponent(token)}`);
    source.addEventListener('connected', () => setConnected(true));
    source.addEventListener('message', () => handler.current());
    source.onerror = () => setConnected(source.readyState === EventSource.OPEN);
    return () => {
      source.close();
      setConnected(false);
    };
  }, [threadId, token]);

  return connected;
}
