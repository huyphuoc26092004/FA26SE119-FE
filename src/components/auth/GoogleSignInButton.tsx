import { useEffect, useRef, useState } from 'react';
import { GoogleIdentityError, mountGoogleButton } from '../../services/googleIdentity';

interface GoogleSignInButtonProps {
  variant: 'signin' | 'signup';
  language: 'vi' | 'en';
  disabled?: boolean;
  onCredential: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
}

export function GoogleSignInButton({
  variant,
  language,
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const container = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onCredential, onError, disabled, language });
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    handlers.current = { onCredential, onError, disabled, language };
  }, [onCredential, onError, disabled, language]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const controller = new AbortController();
    let dispose: (() => void) | undefined;
    setState('loading');
    const reportError = (error: unknown) => {
      if (controller.signal.aborted) return;
      const vi = handlers.current.language === 'vi';
      const message = error instanceof GoogleIdentityError
        ? error.code === 'configuration'
          ? vi ? 'Chưa cấu hình VITE_GOOGLE_CLIENT_ID cho đăng nhập Google.' : 'Google sign-in requires VITE_GOOGLE_CLIENT_ID.'
          : vi ? 'Không tải được đăng nhập Google. Vui lòng thử lại.' : 'Google sign-in could not load. Please try again.'
        : error instanceof Error ? error.message : vi ? 'Đăng nhập Google thất bại.' : 'Google sign-in failed.';
      handlers.current.onError(message);
    };
    mountGoogleButton(element, {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
      variant,
      language,
      width: element.getBoundingClientRect().width || 400,
      signal: controller.signal,
      isDisabled: () => handlers.current.disabled,
      onCredential: async (credential) => {
        if (controller.signal.aborted) return;
        setPending(true);
        try {
          await handlers.current.onCredential(credential);
        } finally {
          if (!controller.signal.aborted) setPending(false);
        }
      },
      onError: reportError,
    }).then((cleanup) => {
      if (controller.signal.aborted) cleanup();
      else {
        dispose = cleanup;
        setState('ready');
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setState('error');
      reportError(error);
    });
    return () => {
      controller.abort();
      dispose?.();
    };
  }, [variant, language, retry]);

  const blocked = disabled || pending;
  return (
    <div className="flex min-h-11 w-full flex-col items-center gap-2" aria-busy={state === 'loading' || pending}>
      <div
        ref={container}
        className={`flex w-full max-w-[400px] justify-center ${blocked ? 'pointer-events-none opacity-60' : ''}`}
        inert={blocked}
      />
      {state === 'loading' && (
        <span role="status" className="text-sm text-slate-500">
          {language === 'vi' ? 'Đang tải đăng nhập Google…' : 'Loading Google sign-in…'}
        </span>
      )}
      {state === 'error' && (
        <button type="button" className="text-sm underline" onClick={() => setRetry((value) => value + 1)} disabled={disabled}>
          {language === 'vi' ? 'Thử tải lại Google' : 'Retry Google sign-in'}
        </button>
      )}
      {pending && <span role="status" className="text-sm text-slate-500">{language === 'vi' ? 'Đang đăng nhập…' : 'Signing in…'}</span>}
    </div>
  );
}
