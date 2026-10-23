// Lets any candidate page (or the old /candidate/assistant route) open the floating chat,
// optionally with a CV and/or job attached. A request made before the widget mounts is kept.
export interface AssistantChatRequest {
  cvId?: string;
  jobId?: string;
}

type Listener = (request: AssistantChatRequest) => void;

let pending: AssistantChatRequest | null = null;
const listeners = new Set<Listener>();

export function requestAssistantChat(request: AssistantChatRequest = {}) {
  if (listeners.size === 0) {
    pending = request;
    return;
  }
  listeners.forEach((listener) => listener(request));
}

export function subscribeAssistantChat(listener: Listener) {
  listeners.add(listener);
  if (pending) {
    const request = pending;
    pending = null;
    listener(request);
  }
  return () => {
    listeners.delete(listener);
  };
}
