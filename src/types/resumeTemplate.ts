export type TemplateLanguage = 'vi' | 'en';

export interface ResumeTemplateAdmin {
  id: string;
  name: string;
  career_path: string | null;
  language: TemplateLanguage;
  description: string;
  is_active: boolean;
  is_trial_enabled: boolean;
  html_content: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResumeTemplateInput {
  name: string;
  careerPath?: string | null;
  language: TemplateLanguage;
  description: string;
  active: boolean;
  trialEnabled: boolean;
  htmlContent: string;
}

export interface TemplateImportBlock {
  id: string;
  tag: string;
  text: string;
}

export interface TemplateImportResponse {
  source_file_name: string;
  source_format: string;
  html_content: string;
  blocks: TemplateImportBlock[];
  warnings: string[];
  requires_review: boolean;
  page_count: number | null;
}

export type TemplateStatusFilter = 'all' | 'active' | 'inactive';
export type TemplateTrialFilter = 'all' | 'trial' | 'standard';
export type TemplateSortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export interface TemplateFilterState {
  search: string;
  status: TemplateStatusFilter;
  language: 'all' | TemplateLanguage;
  trial: TemplateTrialFilter;
  careerPath: string;
  sort: TemplateSortOption;
}

export interface TemplateSlotDef {
  key: string;
  type: 'field' | 'section';
  labelVi: string;
  labelEn: string;
  attribute: string;
  snippet: string;
  required?: boolean;
}
