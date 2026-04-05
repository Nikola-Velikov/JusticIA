import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDescriptionPreview,
  getResultPreviewEntries,
  getResultTitle,
  getSummaryText,
  SOURCE_LABELS,
  type SearchResult,
} from "@/lib/legal-search";

interface SearchResultCardProps {
  result: SearchResult;
  onOpen: (result: SearchResult) => void;
}

export function SearchResultCard({ result, onOpen }: SearchResultCardProps) {
  const metadataEntries = getResultPreviewEntries(result);

  return (
    <Card className="border-border/80 transition-shadow hover:shadow-md">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {SOURCE_LABELS[result.source]}
            </Badge>
            <Badge variant="outline">№ {result.rank}</Badge>
          </div>
          <CardTitle className="text-xl leading-snug">{getResultTitle(result)}</CardTitle>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          onClick={() => onOpen(result)}
        >
          Детайли
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            AI резюме
          </div>
          <p className="text-sm leading-7 text-foreground">{getSummaryText(result)}</p>
        </div>

        {metadataEntries.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metadataEntries.map((entry) => (
              <div key={entry.key} className="rounded-lg border border-border/80 bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.label}
                </p>
                <p className="mt-1 text-sm text-foreground">{entry.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-dashed border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Описание
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {getDescriptionPreview(result.description)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
