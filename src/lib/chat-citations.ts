export interface ChatSourceRef {
  index: string;
  title: string;
}

export interface ChatMatchObject {
  content: string;
  title?: string;
  index?: string;
  article?: string;
  doc_id?: string;
  source_types?: string[];
}

export type ChatMatchInput = string | ChatMatchObject;

export interface NormalizedChatMatch {
  content: string;
  title: string;
  index: string;
  article?: string;
  docId?: string;
  sourceTypes?: string[];
}

export interface GroupedCitationSource {
  key: string;
  title: string;
  index: string;
  matches: NormalizedChatMatch[];
}

export interface CitationMetadata {
  sources?: ChatSourceRef[];
  matches?: ChatMatchInput[];
}

function isMatchObject(value: ChatMatchInput | undefined): value is ChatMatchObject {
  return Boolean(value) && typeof value === "object" && "content" in value;
}

function buildFallbackTitle(source?: ChatSourceRef, position?: number) {
  if (source?.title?.trim()) return source.title.trim();
  return `Източник ${position ?? 0}`;
}

export function normalizeChatMatches(metadata?: CitationMetadata): NormalizedChatMatch[] {
  if (!metadata?.matches?.length) return [];

  return metadata.matches
    .map((match, index) => {
      const source = metadata.sources?.[index];

      if (isMatchObject(match)) {
        return {
          content: match.content?.trim() || "",
          title: match.title?.trim() || buildFallbackTitle(source, index + 1),
          index: match.index?.trim() || source?.index?.trim() || "",
          article: match.article?.trim() || undefined,
          docId: match.doc_id?.trim() || undefined,
          sourceTypes: match.source_types,
        };
      }

      const content = String(match || "").trim();
      return {
        content,
        title: buildFallbackTitle(source, index + 1),
        index: source?.index?.trim() || "",
      };
    })
    .filter((match) => match.content.length > 0);
}

export function getCitationMatchByNumber(
  metadata: CitationMetadata | undefined,
  citationNumber: number,
) {
  const matches = normalizeChatMatches(metadata);
  const index = citationNumber - 1;
  return index >= 0 && index < matches.length ? matches[index] : undefined;
}

export function groupCitationSources(metadata?: CitationMetadata): GroupedCitationSource[] {
  const matches = normalizeChatMatches(metadata);
  const grouped = new Map<string, GroupedCitationSource>();

  matches.forEach((match, index) => {
    const key = match.docId || `${match.title}::${match.index}::${index}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.matches.push(match);
      return;
    }

    grouped.set(key, {
      key,
      title: match.title,
      index: match.index,
      matches: [match],
    });
  });

  return Array.from(grouped.values());
}
