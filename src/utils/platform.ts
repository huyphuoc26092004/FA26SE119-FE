import { Capacitor } from '@capacitor/core';

const PREVIEW_KEY = 'ccv-app-preview';

/**
 * True when the UI runs inside the Capacitor app (Android/iOS).
 * In a browser, open any page with ?app=1 to preview the app shell (?app=0 turns it off).
 */
function detectAppShell() {
  if (Capacitor.isNativePlatform()) return true;
  try {
    const flag = new URLSearchParams(window.location.search).get('app');
    if (flag === '1') sessionStorage.setItem(PREVIEW_KEY, '1');
    if (flag === '0') sessionStorage.removeItem(PREVIEW_KEY);
    return sessionStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

export const IS_APP = detectAppShell();
