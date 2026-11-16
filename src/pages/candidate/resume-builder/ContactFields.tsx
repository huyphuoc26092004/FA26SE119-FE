import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Resume } from '../../../types/domain';

const inputClass =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-0';

const DIAL_CODES = ['+84', '+1', '+44', '+61', '+65', '+81', '+82', '+86', '+49', '+33'];

const copy = {
  vi: {
    firstName: 'Tên',
    lastName: 'Họ',
    position: 'Chức danh mong muốn',
    positionPh: 'Software Engineer',
    phone: 'Điện thoại',
    email: 'Email',
    more: 'Thông tin thêm',
    address: 'Địa chỉ',
    addressPh: 'Thủ Đức',
    city: 'Thành phố',
    cityPh: 'Hồ Chí Minh',
    country: 'Quốc gia',
    countryPh: 'Việt Nam',
  },
  en: {
    firstName: 'First name',
    lastName: 'Last name',
    position: 'Desired job title',
    positionPh: 'Software Engineer',
    phone: 'Phone',
    email: 'Email',
    more: 'More details',
    address: 'Address',
    addressPh: 'Street, district',
    city: 'City',
    cityPh: 'Ho Chi Minh City',
    country: 'Country',
    countryPh: 'Vietnam',
  },
};

/** "Nguyễn Minh Quang" → họ "Nguyễn Minh", tên "Quang" (từ cuối là tên). */
export function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { last: '', first: parts[0] ?? '' };
  return { last: parts.slice(0, -1).join(' '), first: parts[parts.length - 1] };
}

export function splitPhone(phone = '') {
  const match = phone.trim().match(/^(\+\d{1,3})\s*(.*)$/);
  return match ? { code: match[1], number: match[2] } : { code: '+84', number: phone.trim() };
}

/** Địa chỉ lưu chung một ô "địa chỉ, thành phố, quốc gia"; tách từ phải sang trái. */
export function splitLocation(location = '') {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return { address: parts.slice(0, -2).join(', '), city: parts[parts.length - 2], country: parts[parts.length - 1] };
  if (parts.length === 2) return { address: parts[0], city: parts[1], country: '' };
  return { address: '', city: parts[0] ?? '', country: '' };
}

function Field({ label, value, onChange, placeholder, type = 'text', className = '' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] text-slate-500">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

/** Bước Liên hệ theo bố cục mẫu: Tên/Họ, chức danh, điện thoại có mã vùng, email; phần "Thông tin thêm" thu gọn. */
export function ContactFields({ cv, lang, onChange }: { cv: Partial<Resume>; lang: 'vi' | 'en'; onChange: (patch: Partial<Resume>) => void }) {
  const t = copy[lang];
  const [name, setName] = useState(() => splitName(cv.fullName));
  const [phone, setPhone] = useState(() => splitPhone(cv.phone));
  const [place, setPlace] = useState(() => splitLocation(cv.location));
  const [more, setMore] = useState(() => !!(cv.location || cv.linkedin || cv.github || cv.website));

  const setNamePart = (patch: Partial<typeof name>) => {
    const next = { ...name, ...patch };
    setName(next);
    onChange({ fullName: [next.last.trim(), next.first.trim()].filter(Boolean).join(' ') });
  };
  const setPhonePart = (patch: Partial<typeof phone>) => {
    const next = { ...phone, ...patch };
    setPhone(next);
    const number = next.number.trim();
    // Số Việt Nam ghi theo kiểu trong nước (0…); mã vùng khác thì ghi kèm.
    onChange({ phone: !number ? '' : next.code === '+84' ? number : `${next.code} ${number}` });
  };
  const setPlacePart = (patch: Partial<typeof place>) => {
    const next = { ...place, ...patch };
    setPlace(next);
    onChange({ location: [next.address.trim(), next.city.trim(), next.country.trim()].filter(Boolean).join(', ') });
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Field label={t.firstName} value={name.first} onChange={(v) => setNamePart({ first: v })} />
      <Field label={t.lastName} value={name.last} onChange={(v) => setNamePart({ last: v })} />
      <Field className="sm:col-span-2" label={t.position} value={cv.position ?? ''} placeholder={t.positionPh} onChange={(v) => onChange({ position: v })} />
      <label className="block">
        <span className="text-[13px] text-slate-500">{t.phone}</span>
        <span className="flex items-end gap-3">
          <select
            aria-label={lang === 'vi' ? 'Mã vùng' : 'Country code'}
            value={phone.code}
            onChange={(e) => setPhonePart({ code: e.target.value })}
            className="w-20 shrink-0 cursor-pointer border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-0"
          >
            {[...new Set([phone.code, ...DIAL_CODES])].map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input type="tel" value={phone.number} placeholder="0372 093 877" onChange={(e) => setPhonePart({ number: e.target.value })} className={inputClass} />
        </span>
      </label>
      <Field label={t.email} type="email" value={cv.email ?? ''} onChange={(v) => onChange({ email: v })} />

      <button
        type="button"
        onClick={() => setMore((o) => !o)}
        aria-expanded={more}
        className="inline-flex w-fit items-center gap-1.5 text-[15px] text-brand sm:col-span-2"
      >
        {t.more}
        {more ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
      {more && (
        <>
          <Field label={t.address} value={place.address} placeholder={t.addressPh} onChange={(v) => setPlacePart({ address: v })} />
          <Field label={t.city} value={place.city} placeholder={t.cityPh} onChange={(v) => setPlacePart({ city: v })} />
          <Field label={t.country} value={place.country} placeholder={t.countryPh} onChange={(v) => setPlacePart({ country: v })} />
          <Field label="LinkedIn" value={cv.linkedin ?? ''} placeholder="linkedin.com/in/…" onChange={(v) => onChange({ linkedin: v })} />
          <Field label="GitHub" value={cv.github ?? ''} placeholder="github.com/…" onChange={(v) => onChange({ github: v })} />
          <Field label="Website" value={cv.website ?? ''} onChange={(v) => onChange({ website: v })} />
        </>
      )}
    </div>
  );
}
