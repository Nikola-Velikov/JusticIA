import { AlertCircle, Loader2, SearchX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { type SearchResult } from "@/lib/legal-search";

interface SearchResultsListProps {
  loading: boolean;
  submitted: boolean;
  error: string | null;
  results: SearchResult[];
  query: string;
  onOpen: (result: SearchResult) => void;
}

export function SearchResultsList({
  loading,
  submitted,
  error,
  results,
  query,
  onOpen,
}: SearchResultsListProps) {
  if (!submitted) return null;

  if (loading) {
    return (
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Подготвяме резултатите
          </CardTitle>
          <CardDescription>Моля, изчакайте няколко секунди.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 rounded-lg border border-border/80 p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-20 animate-pulse rounded bg-muted" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-16 animate-pulse rounded bg-muted" />
                <div className="h-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Търсенето не беше изпълнено</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="border-dashed border-border/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <SearchX className="h-5 w-5 text-primary" />
            Няма съвпадения
          </CardTitle>
          <CardDescription>
            Не открихме съдебни актове за "{query}". Опитайте с по-кратка формулировка
            или махнете част от уточненията.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <SearchResultCard
          key={`${result.source}-${result.rank}-${result.title}`}
          result={result}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
