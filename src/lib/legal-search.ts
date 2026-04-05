import { apiRootPost } from "@/lib/api";

export type SearchSource = "vas" | "vks" | "curia";
export type SourceSelection = "vks" | "vas" | "curia" | "vks_vas" | "all";

export type BgFilterKey =
  | "gid"
  | "title"
  | "court"
  | "caseType"
  | "caseNumber"
  | "caseYear"
  | "initiatingParty"
  | "respondentParty"
  | "judgeReporter"
  | "department"
  | "incommingNumber";

export type CuriaFilterKey =
  | "caseName"
  | "documentIdentifier"
  | "decisionDate"
  | "partyName"
  | "field";

export type BgFilters = Partial<Record<BgFilterKey, string | number>>;
export type CuriaFilters = Partial<Record<CuriaFilterKey, string>>;

export type BgFilterFormState = Record<BgFilterKey, string>;
export type CuriaFilterFormState = Record<CuriaFilterKey, string>;

export interface SearchFormState {
  query: string;
  topN: string;
  sourceSelection: SourceSelection;
  vasFilters: BgFilterFormState;
  vksFilters: BgFilterFormState;
  curiaFilters: CuriaFilterFormState;
}

export interface SearchRequestPayload {
  query: string;
  topN: number;
  useSources: SearchSource[];
  aiSummary: true;
  vasFilters?: BgFilters;
  vksFilters?: BgFilters;
  curiaFilters?: CuriaFilters;
}

export interface SearchResult {
  rank: number;
  source: SearchSource;
  score: number;
  esScore: number;
  similarity: number;
  title: string | null;
  description: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  fullDocument: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  returned: number;
  results: SearchResult[];
}

export interface SearchOption {
  value: SourceSelection;
  label: string;
  description: string;
}

export interface TopNOption {
  value: string;
  label: string;
}

export interface FilterFieldConfig<T extends string> {
  key: T;
  label: string;
  placeholder: string;
  type?: "text" | "number" | "date";
}

export const SOURCE_OPTIONS: SearchOption[] = [
  {
    value: "vks",
    label: "ВКС",
    description: "Търсене само в практиката на Върховния касационен съд.",
  },
  {
    value: "vas",
    label: "ВАС",
    description: "Търсене само в практиката на Върховния административен съд.",
  },
  {
    value: "curia",
    label: "СЕС",
    description: "Търсене само в практиката на Съда на Европейския съюз.",
  },
  {
    value: "vks_vas",
    label: "ВКС и ВАС",
    description: "Търсене едновременно във ВКС и ВАС.",
  },
  {
    value: "all",
    label: "Всички източници",
    description: "Търсене във ВКС, ВАС и СЕС едновременно.",
  },
];

export const TOP_N_OPTIONS: TopNOption[] = [
  { value: "5", label: "До 5 резултата" },
  { value: "10", label: "До 10 резултата" },
  { value: "15", label: "До 15 резултата" },
  { value: "20", label: "До 20 резултата" },
];

export const BG_FILTER_FIELDS: FilterFieldConfig<BgFilterKey>[] = [
  {
    key: "gid",
    label: "Служебен номер",
    placeholder: "Въведете служебен номер",
  },
  {
    key: "title",
    label: "Заглавие",
    placeholder: "Въведете заглавие",
  },
  {
    key: "court",
    label: "Съд",
    placeholder: "Въведете съд",
  },
  {
    key: "caseType",
    label: "Вид производство",
    placeholder: "Въведете вид производство",
  },
  {
    key: "caseNumber",
    label: "Номер на делото",
    placeholder: "Въведете номер на делото",
    type: "number",
  },
  {
    key: "caseYear",
    label: "Година",
    placeholder: "Въведете година",
    type: "number",
  },
  {
    key: "initiatingParty",
    label: "Жалбоподател или ищец",
    placeholder: "Въведете страна",
  },
  {
    key: "respondentParty",
    label: "Насрещна страна",
    placeholder: "Въведете страна",
  },
  {
    key: "judgeReporter",
    label: "Съдия-докладчик",
    placeholder: "Въведете съдия-докладчик",
  },
  {
    key: "department",
    label: "Отделение",
    placeholder: "Въведете отделение",
  },
  {
    key: "incommingNumber",
    label: "Входящ номер",
    placeholder: "Въведете входящ номер",
    type: "number",
  },
];

export const CURIA_FILTER_FIELDS: FilterFieldConfig<CuriaFilterKey>[] = [
  {
    key: "caseName",
    label: "Име на делото",
    placeholder: "Въведете име на делото",
  },
  {
    key: "documentIdentifier",
    label: "Номер на документа",
    placeholder: "Въведете номер на документа",
  },
  {
    key: "decisionDate",
    label: "Дата на решението",
    placeholder: "Посочете дата",
    type: "date",
  },
  {
    key: "partyName",
    label: "Страна по делото",
    placeholder: "Въведете страна по делото",
  },
];

export const SOURCE_LABELS: Record<SearchSource, string> = {
  vas: "ВАС",
  vks: "ВКС",
  curia: "СЕС",
};

export const FIELD_LABELS: Record<string, string> = {
  _id: "Вътрешен идентификатор",
  gid: "Служебен номер",
  title: "Заглавие",
  court: "Съд",
  caseType: "Вид производство",
  caseNumber: "Номер на делото",
  caseYear: "Година",
  initiatingParty: "Жалбоподател или ищец",
  respondentParty: "Насрещна страна",
  judgeReporter: "Съдия-докладчик",
  department: "Отделение",
  incommingNumber: "Входящ номер",
  formationDate: "Дата на образуване",
  panel: "Състав",
  hasElectronicDocuments: "Електронни документи",
  hasElectronicPayments: "Електронни плащания",
  hasAccess: "Достъп",
  hasScannedFiles: "Сканирани файлове",
  focusCase: "Основно дело",
  archiveCase: "Архивно дело",
  source: "Източник",
  caseName: "Име на делото",
  documentIdentifier: "Номер на документа",
  decisionDate: "Дата на решението",
  partyName: "Страна по делото",
  field: "Правна област",
  description: "Описание",
  fullDocument: "Пълен документ",
};

const NUMERIC_BG_FILTER_KEYS: BgFilterKey[] = [
  "caseNumber",
  "caseYear",
  "incommingNumber",
];

const OMIT_FULL_DOCUMENT_KEYS = new Set([
  "_id",
  "gid",
  "description",
  "embedding",
  "field",
  "searchText",
  "__v",
]);

export const DEFAULT_BG_FILTERS: BgFilterFormState = {
  gid: "",
  title: "",
  court: "",
  caseType: "",
  caseNumber: "",
  caseYear: "",
  initiatingParty: "",
  respondentParty: "",
  judgeReporter: "",
  department: "",
  incommingNumber: "",
};

export const DEFAULT_CURIA_FILTERS: CuriaFilterFormState = {
  caseName: "",
  documentIdentifier: "",
  decisionDate: "",
  partyName: "",
  field: "",
};

export const DEFAULT_SEARCH_FORM: SearchFormState = {
  query: "",
  topN: TOP_N_OPTIONS[0].value,
  sourceSelection: "all",
  vasFilters: { ...DEFAULT_BG_FILTERS },
  vksFilters: { ...DEFAULT_BG_FILTERS },
  curiaFilters: { ...DEFAULT_CURIA_FILTERS },
};

export function getSourcesForSelection(selection: SourceSelection): SearchSource[] {
  switch (selection) {
    case "vks":
      return ["vks"];
    case "vas":
      return ["vas"];
    case "curia":
      return ["curia"];
    case "vks_vas":
      return ["vks", "vas"];
    case "all":
    default:
      return ["vks", "vas", "curia"];
  }
}

function sanitizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildBgFilters(filters: BgFilterFormState): BgFilters | undefined {
  const payload: BgFilters = {};

  for (const key of Object.keys(filters) as BgFilterKey[]) {
    const value = filters[key];
    payload[key] = NUMERIC_BG_FILTER_KEYS.includes(key)
      ? sanitizeNumber(value)
      : sanitizeText(value);
  }

  return hasValues(payload) ? payload : undefined;
}

function buildCuriaFilters(filters: CuriaFilterFormState): CuriaFilters | undefined {
  const payload: CuriaFilters = {};

  for (const key of Object.keys(filters) as CuriaFilterKey[]) {
    payload[key] = sanitizeText(filters[key]);
  }

  return hasValues(payload) ? payload : undefined;
}

function hasValues(obj: Record<string, unknown>) {
  return Object.values(obj).some((value) => value !== undefined);
}

export function buildSearchPayload(form: SearchFormState): SearchRequestPayload {
  const useSources = getSourcesForSelection(form.sourceSelection);
  const payload: SearchRequestPayload = {
    query: form.query.trim(),
    topN: Number(form.topN),
    useSources,
    aiSummary: true,
  };

  if (useSources.includes("vas")) {
    const vasFilters = buildBgFilters(form.vasFilters);
    if (vasFilters) payload.vasFilters = vasFilters;
  }

  if (useSources.includes("vks")) {
    const vksFilters = buildBgFilters(form.vksFilters);
    if (vksFilters) payload.vksFilters = vksFilters;
  }

  if (useSources.includes("curia")) {
    const curiaFilters = buildCuriaFilters(form.curiaFilters);
    if (curiaFilters) payload.curiaFilters = curiaFilters;
  }

  return payload;
}

export async function searchLegalActs(payload: SearchRequestPayload) {
  return apiRootPost<SearchResponse>("/search", payload);
}

export function getResultTitle(result: SearchResult) {
  return result.title || "Съдебен акт";
}

export function getSummaryText(result: SearchResult) {
  return (
    normalizeText(result.summary) ||
    normalizeText(result.description) ||
    "Няма налично резюме за този резултат."
  );
}

export function getDescriptionPreview(description: string | null | undefined, length = 260) {
  const text = normalizeText(description);
  if (!text) return "Няма налично описание за този съдебен акт.";
  return text.length > length ? `${text.slice(0, length).trimEnd()}...` : text;
}

export function getMetadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata)
    .filter(
      ([key, value]) =>
        key !== "source" &&
        key !== "field" &&
        key !== "_id" &&
        key !== "gid" &&
        isDisplayableValue(value),
    )
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key),
      value: formatValue(value),
    }));
}

export function getResultPreviewEntries(result: SearchResult) {
  const metadataEntries = getMetadataEntries(result.metadata);

  if (result.source === "curia") {
    const preferred = ["documentIdentifier", "decisionDate", "partyName"];
    return preferred
      .map((key) => metadataEntries.find((entry) => entry.key === key))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }

  const preferred = ["court", "caseType", "caseNumber", "caseYear", "judgeReporter"];
  return preferred
    .map((key) => metadataEntries.find((entry) => entry.key === key))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export function getFullDocumentEntries(document: Record<string, unknown>) {
  const scalarEntries = Object.entries(document)
    .filter(([key, value]) => !OMIT_FULL_DOCUMENT_KEYS.has(key) && isDisplayableValue(value))
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key),
      value: formatValue(value),
      long: typeof value === "string" && normalizeText(value).length > 280,
    }));

  return {
    compact: scalarEntries.filter((entry) => !entry.long),
    longText: scalarEntries.filter((entry) => entry.long),
  };
}

export function getFieldLabel(key: string) {
  return FIELD_LABELS[key] || key;
}

export function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Да" : "Не";
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") {
    const trimmed = normalizeText(value);
    return isIsoDate(trimmed) ? formatDate(trimmed) : trimmed;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => formatValue(item)).filter(Boolean);
    return items.join(", ");
  }
  return "";
}

export function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isDisplayableValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return normalizeText(value).length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0 && value.every(isPrimitive);
  return false;
}

function isPrimitive(value: unknown) {
  return ["string", "number", "boolean"].includes(typeof value);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value);
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("bg-BG");
}
