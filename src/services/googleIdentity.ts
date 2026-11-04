interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityApi {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select: boolean;
  }) => void;
  renderButton: (
    container: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline';
      size: 'large';
      text: 'signin_with' | 'signup_with';
      shape: 'rectangular';
      width: number;
      locale: 'vi' | 'en';
      click_listener: () => void;
    }
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentityApi } };
  }
}

export class GoogleIdentityError extends Error {
  constructor(public readonly code: 'configuration' | 'load' | 'credential') {
    super(`Google sign-in: ${code}`);
  }
}

const SDK_URL = 'https://accounts.google.com/gsi/client';
let sdkPromise: Promise<GoogleIdentityApi> | undefined;
let initializedClientId: string | undefined;
let activeTarget: symbol | undefined;
const targets = new Map<symbol, {
  onCredential: (credential: string) => Promise<void>;
  onError: (error: unknown) => void;
  isDisabled: () => boolean;
  pending: boolean;
}>();

/** Share the official SDK request between mounts, including React StrictMode remounts. */
export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  const existingApi = window.google?.accounts?.id;
  if (existingApi) return Promise.resolve(existingApi);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<GoogleIdentityApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    const script = existingScript ?? document.createElement('script');
    const cleanup = () => {
      window.clearTimeout(timeout);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
    };
    const failed = () => {
      cleanup();
      // A failed tag must not trap a later retry on an already-fired error event.
      script.remove();
      reject(new GoogleIdentityError('load'));
    };
    const loaded = () => {
      const api = window.google?.accounts?.id;
      if (!api) {
        failed();
        return;
      }
      cleanup();
      resolve(api);
    };
    const timeout = window.setTimeout(failed, 15_000);
    script.addEventListener('load', loaded);
    script.addEventListener('error', failed);
    if (!existingScript) {
      script.src = SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    sdkPromise = undefined;
    throw error;
  });
  return sdkPromise;
}

interface GoogleButtonOptions {
  clientId: string;
  variant: 'signin' | 'signup';
  language: 'vi' | 'en';
  width: number;
  signal: AbortSignal;
  isDisabled: () => boolean;
  onCredential: (credential: string) => Promise<void>;
  onError: (error: unknown) => void;
}

export async function mountGoogleButton(
  container: HTMLElement,
  options: GoogleButtonOptions
): Promise<() => void> {
  const clientId = options.clientId.trim();
  if (!clientId.endsWith('.apps.googleusercontent.com')) throw new GoogleIdentityError('configuration');
  const api = await loadGoogleIdentity();
  if (options.signal.aborted) return () => undefined;

  // GIS has one global callback. Register it once and dispatch only to the clicked,
  // still-mounted button; never leave a callback pointing at an old auth page.
  if (initializedClientId && initializedClientId !== clientId) throw new GoogleIdentityError('configuration');
  if (!initializedClientId) {
    api.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (response) => {
        const target = activeTarget ? targets.get(activeTarget) : undefined;
        if (!target || target.pending || target.isDisabled()) return;
        if (typeof response.credential !== 'string' || !response.credential) {
          target.onError(new GoogleIdentityError('credential'));
          return;
        }
        target.pending = true;
        Promise.resolve()
          .then(() => target.onCredential(response.credential!))
          .catch((error: unknown) => target.onError(error))
          .finally(() => { target.pending = false; });
      },
    });
    initializedClientId = clientId;
  }

  const key = Symbol('google-button');
  targets.set(key, {
    onCredential: options.onCredential,
    onError: options.onError,
    isDisabled: options.isDisabled,
    pending: false,
  });
  const dispose = () => {
    targets.delete(key);
    if (activeTarget === key) activeTarget = undefined;
    container.replaceChildren();
  };
  try {
    api.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: options.variant === 'signup' ? 'signup_with' : 'signin_with',
      shape: 'rectangular',
      width: Math.min(400, Math.max(200, Math.floor(options.width))),
      locale: options.language,
      click_listener: () => {
        if (!options.isDisabled()) activeTarget = key;
      },
    });
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}
