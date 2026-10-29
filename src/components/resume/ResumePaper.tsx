import { useEffect, useRef, useState } from 'react';
import { A4_HEIGHT_PX, A4_WIDTH_PX } from '../../utils/resumeTemplateRender';

interface ResumePaperProps {
  /** Toàn bộ tài liệu HTML đã điền dữ liệu. */
  html: string;
  title: string;
  /** Vẽ vạch ngắt trang A4 và trả số trang về cho trang cha. */
  showPageBreaks?: boolean;
  onPageCount?: (pages: number) => void;
  className?: string;
}

/**
 * Trang CV khổ A4 thu nhỏ vừa chiều ngang khung chứa. HTML chạy trong iframe
 * không cho script (sandbox) nên CSS của mẫu không ảnh hưởng tới app.
 */
export function ResumePaper({ html, title, showPageBreaks = false, onPageCount, className = '' }: ResumePaperProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(A4_HEIGHT_PX);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / A4_WIDTH_PX);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const measure = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    const next = Math.max(A4_HEIGHT_PX, doc.documentElement.scrollHeight);
    setHeight(next);
    onPageCount?.(Math.max(1, Math.ceil((next - 2) / A4_HEIGHT_PX)));
  };

  // Ảnh/font trong mẫu có thể nạp chậm; đo lại sau một nhịp.
  useEffect(() => {
    const timer = window.setTimeout(measure, 250);
    return () => window.clearTimeout(timer);
  }, [html]);

  const pages = Math.max(1, Math.ceil((height - 2) / A4_HEIGHT_PX));
  const paperHeight = showPageBreaks ? pages * A4_HEIGHT_PX : height;

  return (
    <div ref={boxRef} className={`relative w-full overflow-hidden bg-white ${className}`} style={{ height: paperHeight * scale }}>
      <iframe
        ref={frameRef}
        title={title}
        srcDoc={html}
        sandbox="allow-same-origin"
        onLoad={measure}
        scrolling="no"
        className="pointer-events-none absolute left-0 top-0 block origin-top-left border-0 bg-white"
        style={{ width: A4_WIDTH_PX, height: paperHeight, transform: `scale(${scale})` }}
      />
      {showPageBreaks &&
        Array.from({ length: pages - 1 }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute inset-x-0 border-t border-dashed border-slate-300"
            style={{ top: (i + 1) * A4_HEIGHT_PX * scale }}
          >
            <span className="absolute right-2 top-1 bg-white px-1 text-[10px] text-slate-400">{i + 2}</span>
          </div>
        ))}
    </div>
  );
}
