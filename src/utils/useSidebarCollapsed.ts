import { useState } from 'react';

/** Trạng thái thu gọn sidebar trên desktop, nhớ theo trình duyệt. */
export function useSidebarCollapsed(storageKey: string) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(storageKey, prev ? '0' : '1');
      } catch {
        // Không lưu được thì chỉ giữ trong phiên này.
      }
      return !prev;
    });
  return [collapsed, toggle] as const;
}
