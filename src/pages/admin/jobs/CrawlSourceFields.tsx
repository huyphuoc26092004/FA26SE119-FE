import { fieldLabel, underlineInput } from '../../../components/admin/AdminKit';
import { MultiSelect } from '../../../components/admin/MultiSelect';
import type { CrawlSource, CrawlSourceSite } from '../../../types/jobCrawl';
import { KEYWORD_SUGGESTIONS, LOCATION_OPTIONS, ROLE_SUGGESTIONS, SITE_LABEL, clamp, keywordsForRoles, type CrawlSelection } from './crawlFormat';

const SITES: CrawlSourceSite[] = ['ITVIEC', 'TOPCV'];

/** Trang nguồn / từ khoá / vai trò / địa điểm chọn được nhiều giá trị, dùng chung cho chạy ngay và lịch tự động. */
export function CrawlSelectionFields({
  value,
  onChange,
  disabled,
}: {
  value: CrawlSelection;
  onChange: (next: CrawlSelection) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof CrawlSelection>(key: K, v: CrawlSelection[K]) => onChange({ ...value, [key]: v });
  const siteLabels = SITES.map((s) => SITE_LABEL[s]);
  const keywordOptions = keywordsForRoles(value.roles);

  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-6">
      <div className="xl:col-span-2">
        <MultiSelect
          label="Trang nguồn"
          options={siteLabels}
          allowCustom={false}
          disabled={disabled}
          value={value.sourceSites.map((s) => SITE_LABEL[s])}
          onChange={(labels) => set('sourceSites', SITES.filter((s) => labels.includes(SITE_LABEL[s])))}
          placeholder="Chọn ITviec, TopCV"
        />
      </div>
      <div className="xl:col-span-2">
        <MultiSelect
          label="1. Nhóm vai trò"
          options={ROLE_SUGGESTIONS}
          disabled={disabled}
          value={value.roles}
          onChange={(v) => {
            const roles = v.map((r) => r.slice(0, 100));
            // Bỏ các ngôn ngữ gợi ý không còn thuộc vai trò nào đã chọn; giữ từ khoá tự gõ.
            const allowed = keywordsForRoles(roles);
            const keywords = value.keywords.filter((k) => allowed.includes(k) || (!KEYWORD_SUGGESTIONS.includes(k) && !keywordsForRoles(value.roles).includes(k)));
            onChange({ ...value, roles, keywords });
          }}
          placeholder="Chọn vai trò trước"
        />
      </div>
      <div className="xl:col-span-2">
        <MultiSelect
          label="2. Ngôn ngữ / từ khoá"
          options={keywordOptions}
          disabled={disabled || value.roles.length === 0}
          value={value.keywords}
          onChange={(v) => set('keywords', v.map((k) => k.slice(0, 255)))}
          placeholder={value.roles.length ? 'Chọn ngôn ngữ của vai trò đã chọn' : 'Chọn nhóm vai trò trước'}
        />
      </div>
      <div className="xl:col-span-2">
        <MultiSelect
          label="Địa điểm"
          options={LOCATION_OPTIONS}
          disabled={disabled}
          value={value.locations}
          onChange={(v) => set('locations', v.map((l) => l.slice(0, 120)))}
          emptyLabel="Toàn quốc (không chọn)"
        />
      </div>
      <label className="block xl:col-span-1">
        <span className={fieldLabel}>Số tin tối đa (1–100)</span>
        <input
          type="number"
          min={1}
          max={100}
          className={underlineInput}
          value={value.limit}
          disabled={disabled}
          onChange={(e) => set('limit', clamp(Number(e.target.value), 1, 100))}
        />
      </label>
      <label className="block xl:col-span-1">
        <span className={fieldLabel}>Số trang tìm (1–10)</span>
        <input
          type="number"
          min={1}
          max={10}
          className={underlineInput}
          value={value.maxPages}
          disabled={disabled}
          onChange={(e) => set('maxPages', clamp(Number(e.target.value), 1, 10))}
        />
      </label>
    </div>
  );
}

export const isSelectionComplete = (s: CrawlSelection) => s.sourceSites.length > 0 && s.keywords.length > 0 && s.roles.length > 0;
export const isSourceComplete = (s: CrawlSource) => s.keyword.trim() !== '' && s.roleCategory.trim() !== '';
