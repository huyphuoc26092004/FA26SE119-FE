import type { CSSProperties } from 'react';
import './guestTrialMotion.css';

/** Độ trễ cho hiệu ứng hiện dần (.gt-rise / .gt-item trong guestTrialMotion.css). */
export const gtDelay = (ms: number) => ({ '--gt-delay': `${ms}ms` }) as CSSProperties;
