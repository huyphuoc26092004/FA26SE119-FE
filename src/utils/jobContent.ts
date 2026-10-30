/**
 * Tách nội dung tin tuyển dụng (HTML gốc hoặc text đã bị gộp thành một dòng) thành
 * các mục có tiêu đề, đoạn văn và gạch đầu dòng để hiển thị dễ đọc.
 * Chỉ đọc text từ HTML, không render HTML gốc.
 */

export type JobContentBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

export interface JobContentSection {
  title?: string;
  blocks: JobContentBlock[];
}

const clean = (value: string) => value.replace(/[\s\u00a0]+/g, ' ').trim();

const BULLET = /^[•\-–*+●▪■◦·]\s*/;

/** Tiêu đề hay gặp trên ITviec/TopCV, dùng khi chỉ còn text một dòng. */
const KNOWN_HEADINGS = [
  'Top 3 Reasons To Join Us',
  'Job Description',
  'Your Role & Responsibilities',
  'Your Role and Responsibilities',
  'Responsibilities',
  'Your Skills and Experience',
  'Skills and Experience',
  "Why You'll Love Working Here",
  'Why You’ll Love Working Here',
  'What We Offer',
  'Mô tả công việc',
  'Yêu cầu ứng viên',
  'Yêu cầu công việc',
  'Quyền lợi được hưởng',
  'Quyền lợi ứng viên',
  'Quyền lợi',
];

class Builder {
  sections: JobContentSection[] = [];
  private current: JobContentSection = { blocks: [] };
  private seen = new Set<string>();
  private seenBlocks = new Set<string>();

  heading(title: string) {
    const text = clean(title).replace(/:$/, '');
    if (!text) return;
    this.flush();
    this.current = { title: text, blocks: [] };
  }

  /** Chữ đậm trong một mục đã có tiêu đề là tiêu đề phụ, không mở mục mới. */
  subheading(title: string) {
    const text = clean(title).replace(/:$/, '');
    if (!text) return;
    if (this.current.title) this.current.blocks.push({ type: 'h', text });
    else this.heading(text);
  }

  paragraph(text: string) {
    const lines = text
      .split(/\n+/)
      .map(clean)
      .filter(Boolean);
    for (const line of lines) {
      if (BULLET.test(line)) this.bullet(line.replace(BULLET, ''));
      else this.push({ type: 'p', text: line });
    }
  }

  bullet(text: string) {
    const item = clean(text);
    if (!item) return;
    const last = this.current.blocks[this.current.blocks.length - 1];
    if (last?.type === 'ul') last.items.push(item);
    else this.push({ type: 'ul', items: [item] });
  }

  private push(block: JobContentBlock) {
    this.current.blocks.push(block);
  }

  flush() {
    const { title } = this.current;
    // Crawler nối thêm mục quyền lợi/yêu cầu vào cuối mô tả, nên bỏ các khối đã gặp.
    const blocks = this.current.blocks.filter((b) => {
      if (b.type === 'h') return true;
      const key = b.type === 'p' ? b.text : b.items.join('|');
      if (key.length < 20) return true;
      if (this.seenBlocks.has(key)) return false;
      this.seenBlocks.add(key);
      return true;
    });
    while (blocks.length > 0 && blocks[blocks.length - 1].type === 'h') blocks.pop();
    this.current.blocks = blocks;
    if (blocks.length > 0) {
      // Crawler gộp mô tả với từng mục nên một mục có thể xuất hiện hai lần.
      const key = `${title ?? ''}|${blocks.map((b) => (b.type === 'ul' ? b.items.join('|') : b.text)).join('|')}`;
      if (!this.seen.has(key)) {
        this.seen.add(key);
        this.sections.push(this.current);
      }
    }
    this.current = { blocks: [] };
  }

  done() {
    this.flush();
    return this.sections;
  }
}

const BLOCK_TAGS = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'UL', 'OL', 'LI', 'TABLE', 'BLOCKQUOTE']);

/** Đoạn chỉ gồm chữ đậm ngắn, ví dụ <p><strong>Job Description</strong></p>, coi như tiêu đề. */
const isBoldHeading = (el: Element) => {
  const text = clean(el.textContent ?? '');
  if (!text || text.length > 80) return false;
  const bold = Array.from(el.querySelectorAll('strong,b'))
    .map((b) => clean(b.textContent ?? ''))
    .join(' ');
  return bold === text;
};

/** Text của phần tử, giữ <br> thành xuống dòng. */
const textWithBreaks = (el: Element) => {
  const copy = el.cloneNode(true) as Element;
  copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return copy.textContent ?? '';
};

function walk(node: Element, out: Builder) {
  let inline = '';
  const flushInline = () => {
    if (clean(inline)) out.paragraph(inline);
    inline = '';
  };

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      inline += child.textContent ?? '';
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName;

    if (/^H[1-6]$/.test(tag)) {
      flushInline();
      out.heading(el.textContent ?? '');
    } else if (tag === 'UL' || tag === 'OL') {
      flushInline();
      el.querySelectorAll(':scope > li').forEach((li) => {
        if (li.querySelector('ul,ol')) walk(li, out);
        else out.bullet(li.textContent ?? '');
      });
    } else if (tag === 'BR') {
      inline += '\n';
    } else if (tag === 'P' || tag === 'LI') {
      flushInline();
      if (isBoldHeading(el)) out.subheading(el.textContent ?? '');
      else if (tag === 'LI') out.bullet(el.textContent ?? '');
      else out.paragraph(textWithBreaks(el));
    } else if (BLOCK_TAGS.has(tag) || el.querySelector(Array.from(BLOCK_TAGS).join(',') + ',h1,h2,h3,h4,h5,h6')) {
      flushInline();
      if (tag === 'DIV' && isBoldHeading(el) && !el.querySelector('p,ul,ol,div')) out.subheading(el.textContent ?? '');
      else walk(el, out);
    } else if (tag !== 'SCRIPT' && tag !== 'STYLE') {
      inline += tag === 'SPAN' || tag === 'A' || tag === 'STRONG' || tag === 'B' || tag === 'EM' || tag === 'I'
        ? textWithBreaks(el)
        : el.textContent ?? '';
    }
  }
  flushInline();
}

export function parseJobHtml(html: string): JobContentSection[] {
  if (typeof DOMParser === 'undefined') return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = new Builder();
  walk(doc.body, out);
  return out.done();
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Text một dòng: cắt theo các tiêu đề quen thuộc và các dấu gạch đầu dòng còn sót. */
export function parseJobText(text: string): JobContentSection[] {
  const pattern = new RegExp(`(${KNOWN_HEADINGS.map(escapeRegExp).join('|')})\\s*:?`, 'g');
  const out = new Builder();
  let last = 0;
  let match: RegExpExecArray | null;
  const body = (chunk: string) => {
    // Chèn xuống dòng trước dấu đầu dòng để Builder tách thành danh sách.
    const withBreaks = chunk.replace(/\s*([•●▪■◦])\s*/g, '\n$1 ').replace(/\s+(-|–|\+)\s+(?=\p{Lu})/gu, '\n$1 ');
    if (!clean(withBreaks)) return;
    if (withBreaks.includes('\n')) {
      out.paragraph(withBreaks);
      return;
    }
    // Không còn dấu nào: mục dài thì tách theo câu thành gạch đầu dòng.
    const sentences = clean(withBreaks).split(/(?<=[.!?;])\s+(?=\p{Lu})/u);
    if (sentences.length > 2) sentences.forEach((line) => out.bullet(line));
    else out.paragraph(withBreaks);
  };
  while ((match = pattern.exec(text))) {
    body(text.slice(last, match.index));
    out.heading(match[1]);
    last = match.index + match[0].length;
  }
  body(text.slice(last));
  return out.done();
}

/** Ưu tiên HTML gốc vì còn cấu trúc; không có thì đoán từ text. */
export function parseJobContent(html?: string, text?: string): JobContentSection[] {
  const fromHtml = html ? parseJobHtml(html) : [];
  if (fromHtml.length > 0) return fromHtml;
  return text ? parseJobText(text) : [];
}

export const sectionLength = (sections: JobContentSection[]) =>
  sections.reduce(
    (sum, s) => sum + s.blocks.reduce((n, b) => n + (b.type === 'ul' ? b.items.join(' ').length : b.text.length), 0),
    0,
  );
