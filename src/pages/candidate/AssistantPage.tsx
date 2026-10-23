import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { requestAssistantChat } from './assistant/assistantChatBus';

// The assistant now lives in the floating chat (bottom-right, mounted in CandidateLayout).
// This route stays so old links like /candidate/assistant?jobId=… keep working: it opens the
// chat with that context, then returns to the page the user came from.
export default function AssistantPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    requestAssistantChat({
      cvId: searchParams.get('cvId') || searchParams.get('resumeId') || undefined,
      jobId: searchParams.get('jobId') || undefined,
    });

    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate('/candidate', { replace: true });
  }, [navigate, searchParams]);

  return null;
}
