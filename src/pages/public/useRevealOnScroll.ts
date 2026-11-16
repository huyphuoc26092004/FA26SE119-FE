import { useEffect, useRef } from 'react';

/**
 * Gắn .hp-motion lên khối gốc rồi thêm .is-visible cho mỗi phần tử [data-reveal] khi nó vào khung nhìn.
 * Không có IntersectionObserver hoặc người dùng giảm chuyển động: hiện ngay toàn bộ.
 */
export function useRevealOnScroll<T extends HTMLElement>() {
  const root = useRef<T>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const targets = Array.from(element.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }
    element.classList.add('hp-motion');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return root;
}

/** style={reveal(i)} → trễ lần lượt cho các phần tử trong cùng nhóm. */
export const revealDelay = (index: number, step = 90, base = 0) => ({ ['--reveal-delay' as string]: `${base + index * step}ms` });
