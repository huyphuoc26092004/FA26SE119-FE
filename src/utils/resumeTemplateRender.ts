import type { Resume } from '../types/domain';

/** Kích thước trang A4 ở 96dpi, dùng để thu nhỏ bản xem trước cho vừa khung. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Giữ xuống dòng người dùng gõ trong ô mô tả. */
const multiline = (value: string) => escapeHtml(value.trim()).replace(/\n/g, '<br>');

const period = (start?: string, end?: string, isCurrent?: boolean, presentLabel = 'Hiện tại') => {
  const to = isCurrent ? presentLabel : end?.trim();
  return [start?.trim(), to].filter(Boolean).join(' – ');
};

interface Entry {
  title: string;
  subtitle?: string;
  period?: string;
  text?: string;
  bullets?: string[];
}

const entryHtml = (item: Entry) => {
  const bullets = (item.bullets ?? []).map((b) => b.trim()).filter(Boolean);
  return `
    <div class="cv-entry" style="margin-bottom: 12px; break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
        <span class="cv-entry-title" style="font-size: 13.5px; font-weight: 700; color: inherit;">${escapeHtml(item.title)}</span>
        ${item.period ? `<span class="cv-entry-period" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums;">${icon('calendar', '11px')}${escapeHtml(item.period)}</span>` : ''}
      </div>
      ${item.subtitle ? `<div class="cv-entry-subtitle" style="font-size: 12.5px; font-weight: 600; opacity: 0.85; margin: 1px 0 3px 0;">${escapeHtml(item.subtitle)}</div>` : ''}
      ${item.text?.trim() ? `<p class="cv-entry-text" style="margin: 0 0 4px 0; font-size: 12.5px; line-height: 1.55; opacity: 0.9;">${multiline(item.text)}</p>` : ''}
      ${
        bullets.length
          ? `<ul class="cv-entry-items" style="margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.5; opacity: 0.9;">${bullets
              .map((b) => `<li style="margin-bottom: 2.5px;">${escapeHtml(b)}</li>`)
              .join('')}</ul>`
          : ''
      }
    </div>`;
};

const pillsHtml = (items: string[]) => `
  <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px;">
    ${items
      .map(
        (s) =>
          `<span class="cv-skill-pill" style="display: inline-flex; align-items: center; padding: 2.5px 8px; font-size: 11px; font-weight: 500; border-radius: 4px; border: 1px solid currentColor; opacity: 0.9;">${escapeHtml(s)}</span>`,
      )
      .join('')}
  </div>`;

const hasText = (value?: string) => Boolean(value && value.trim());

/** Đường vẽ icon (kiểu Lucide, nét 2px) cho thông tin liên hệ và tiêu đề mục. */
const ICON_PATHS = {
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  website: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5-2.6-.5-5.4-.5-8 0C6 2 5 2 5 2c-.3 1.1-.3 2.3 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.8 1.7-.2.6-.3 1.2-.2 1.8v4"/><path d="M9 18c-4.5 2-5-2-7-2"/>',
  summary: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  experience: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  education: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  skills: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  projects: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
  certifications: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
} as const;

type IconName = keyof typeof ICON_PATHS;

const icon = (name: IconName, size = '1em') =>
  `<svg data-cv-icon="${name}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0; vertical-align: -0.125em;">${ICON_PATHS[name]}</svg>`;

/**
 * Bỏ một mục trống khỏi mẫu: cả khối `section` chứa nó, hoặc (với cột bên kiểu
 * sidebar) chính ô đó cùng tiêu đề đứng ngay trước.
 */
function removeSlot(el: Element) {
  const section = el.parentElement?.closest('section, .cv-section');
  if (el.matches('section, .cv-section')) {
    el.remove();
    return;
  }
  if (section && section.querySelectorAll('[data-cv-section]').length === 1) {
    section.remove();
    return;
  }
  const prev = el.previousElementSibling;
  if (prev && /^H[1-4]$/.test(prev.tagName)) prev.remove();
  el.remove();
}

export interface RenderOptions {
  /** Ngôn ngữ của nhãn phụ (Hiện tại / Present, Ngoại ngữ / Languages...). */
  lang?: 'vi' | 'en';
  /** Chữ mờ hiện ở ô họ tên khi người dùng chưa nhập. */
  namePlaceholder?: string;
}

/**
 * Điền dữ liệu CV người dùng đang nhập vào HTML của mẫu (các ô `data-cv-field` /
 * `data-cv-section` giống trang quản trị mẫu). Mục nào trống thì ẩn khỏi bản xem trước.
 */
export function renderTemplateWithResume(html: string, cv: Partial<Resume>, options: RenderOptions = {}): string {
  if (!html) return '';
  const lang = options.lang ?? 'vi';
  const labels =
    lang === 'en'
      ? { present: 'Present', languages: 'Languages', gpa: 'GPA', awards: 'Awards' }
      : { present: 'Hiện tại', languages: 'Ngoại ngữ', gpa: 'GPA', awards: 'Giải thưởng' };

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const setField = (key: string, value: string | undefined, placeholder?: string) => {
    doc.querySelectorAll(`[data-cv-field="${key}"]`).forEach((el) => {
      if (hasText(value)) {
        el.textContent = value!.trim();
      } else if (placeholder) {
        el.textContent = placeholder;
        (el as HTMLElement).style.opacity = '0.25';
      } else {
        el.remove();
      }
    });
  };

  const fillSection = (key: string, content: string) => {
    doc.querySelectorAll(`[data-cv-section="${key}"]`).forEach((el) => {
      if (!content.trim()) {
        removeSlot(el);
        return;
      }
      // Mẫu do backend sinh có <h2> nằm ngay trong ô; giữ lại tiêu đề đó.
      const heading = el.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
      el.innerHTML = (heading ? heading.outerHTML : '') + content;
      addHeadingIcon(el, key as IconName);
    });
  };

  /** Gắn icon trước tiêu đề của mục (tiêu đề nằm trong ô, trong section, hoặc ngay trước ô). */
  const addHeadingIcon = (slot: Element, name: IconName) => {
    if (!(name in ICON_PATHS)) return;
    const own = slot.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
    const prev = slot.previousElementSibling;
    const section = slot.parentElement?.closest('section, .cv-section');
    const heading =
      own ??
      (prev && /^H[1-4]$/.test(prev.tagName) ? prev : null) ??
      (section && section.querySelectorAll('[data-cv-section]').length === 1 ? section.querySelector('h1, h2, h3, h4') : null);
    if (!heading || heading.querySelector('[data-cv-icon]')) return;
    heading.insertAdjacentHTML('afterbegin', `<span style="display: inline-flex; margin-right: 0.45em; vertical-align: -0.1em;">${icon(name, '0.95em')}</span>`);
  };

  setField('fullName', cv.fullName, options.namePlaceholder);
  setField('headline', cv.position);
  // Liên hệ: mỗi mục một icon; dùng inline-flex để mẫu căn giữa vẫn căn giữa.
  const contactItems = (
    [
      ['mail', cv.email],
      ['phone', cv.phone],
      ['location', cv.location],
      ['website', cv.website],
      ['linkedin', cv.linkedin],
      ['github', cv.github],
    ] as [IconName, string | undefined][]
  ).filter(([, v]) => hasText(v));
  doc.querySelectorAll('[data-cv-field="contact"]').forEach((el) => {
    if (!contactItems.length) {
      el.remove();
      return;
    }
    el.innerHTML = contactItems
      .map(
        ([name, v], i) =>
          `<span style="display: inline-flex; align-items: center; gap: 5px; margin-right: ${i < contactItems.length - 1 ? '14px' : '0'}; white-space: nowrap;">${icon(name, '0.95em')}<span>${escapeHtml(v!.trim())}</span></span>`,
      )
      .join(' ');
  });

  // Ô ảnh đại diện chữ "CV" ở mẫu hai cột: thay bằng chữ cái đầu của tên.
  const initials = (cv.fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  doc.querySelectorAll('.cv-avatar').forEach((el) => {
    el.textContent = initials || 'CV';
  });

  fillSection(
    'summary',
    hasText(cv.summary)
      ? `<p class="cv-entry-text" style="margin: 0; line-height: 1.6; font-size: 13px;">${multiline(cv.summary!)}</p>`
      : '',
  );

  fillSection(
    'experience',
    (cv.experience ?? [])
      .filter((e) => hasText(e.role) || hasText(e.company) || hasText(e.description))
      .map((e) =>
        entryHtml({
          title: e.role || e.company,
          subtitle: [e.role ? e.company : '', e.location].filter(hasText).join(' • '),
          period: period(e.startDate, e.endDate, e.isCurrent, labels.present),
          text: e.description,
          bullets: e.highlights,
        }),
      )
      .join(''),
  );

  fillSection(
    'education',
    (cv.education ?? [])
      .filter((e) => hasText(e.school) || hasText(e.degree) || hasText(e.field))
      .map((e) =>
        entryHtml({
          title: [e.degree, e.field].filter(hasText).join(' – ') || e.school,
          subtitle: e.degree || e.field ? e.school : '',
          period: period(e.startDate, e.endDate),
          text: hasText(e.gpa) ? `${labels.gpa}: ${e.gpa}` : '',
          bullets: e.highlights,
        }),
      )
      .join(''),
  );

  const skills = [...(cv.skills ?? []), ...(cv.softSkills ?? [])].map((s) => s.trim()).filter(Boolean);
  const languages = (cv.languages ?? []).filter((l) => hasText(l.name));
  fillSection(
    'skills',
    (skills.length ? pillsHtml(skills) : '') +
      (languages.length
        ? `<p class="cv-entry-text" style="margin: 8px 0 0 0; font-size: 12.5px;"><strong>${labels.languages}:</strong> ${languages
            .map((l) => escapeHtml(l.level ? `${l.name} (${l.level})` : l.name))
            .join(', ')}</p>`
        : ''),
  );

  fillSection(
    'projects',
    (cv.projects ?? [])
      .filter((p) => hasText(p.name) || hasText(p.description))
      .map((p) =>
        entryHtml({
          title: p.name,
          subtitle: [p.role, p.techStack?.filter(hasText).join(', '), p.link].filter(hasText).join(' • '),
          text: p.description,
        }),
      )
      .join(''),
  );

  fillSection(
    'certifications',
    [
      ...(cv.certifications ?? [])
        .filter((c) => hasText(c.name))
        .map((c) => entryHtml({ title: c.name, subtitle: c.issuer, period: c.date })),
      ...(cv.awards ?? [])
        .filter((a) => hasText(a.title))
        .map((a) => entryHtml({ title: a.title, subtitle: a.issuer, period: a.year, text: a.description })),
    ].join(''),
  );

  // Trang trắng cỡ A4; CSS của mẫu vẫn được ưu tiên vì nằm sau.
  const style = doc.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    html { background: #ffffff; }
    body { min-height: ${A4_HEIGHT_PX}px; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  `;
  doc.head.insertBefore(style, doc.head.firstChild);

  return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
}
