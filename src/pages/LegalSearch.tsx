import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Scale, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { SearchFilterPanel } from "@/components/search/SearchFilterPanel";
import { SearchResultDetail } from "@/components/search/SearchResultDetail";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, userError } from "@/lib/api";
import {
  BG_FILTER_FIELDS,
  buildSearchPayload,
  CURIA_FILTER_FIELDS,
  DEFAULT_BG_FILTERS,
  DEFAULT_CURIA_FILTERS,
  DEFAULT_SEARCH_FORM,
  getSourcesForSelection,
  searchLegalActs,
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  TOP_N_OPTIONS,
  type BgFilterKey,
  type CuriaFilterKey,
  type SearchFormState,
  type SearchResult,
  type SourceSelection,
} from "@/lib/legal-search";

export default function LegalSearch() {
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | undefined>(undefined);
  const [form, setForm] = useState<SearchFormState>(DEFAULT_SEARCH_FORM);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const activeSources = useMemo(
    () => getSourcesForSelection(form.sourceSelection),
    [form.sourceSelection]
  );

  const selectedSourceOption = useMemo(
    () => SOURCE_OPTIONS.find((option) => option.value === form.sourceSelection),
    [form.sourceSelection]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const me = await apiGet<{ user: { id: string; email: string } }>("/auth/me");
        setUser({ name: me.user.email.split("@")[0], email: me.user.email });
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      } finally {
        setLoadingUser(false);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const updateBgFilters = (
    source: "vasFilters" | "vksFilters",
    field: BgFilterKey,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [source]: {
        ...current[source],
        [field]: value,
      },
    }));
  };

  const updateCuriaFilters = (field: CuriaFilterKey, value: string) => {
    setForm((current) => ({
      ...current,
      curiaFilters: {
        ...current.curiaFilters,
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setForm({
      ...DEFAULT_SEARCH_FORM,
      vasFilters: { ...DEFAULT_BG_FILTERS },
      vksFilters: { ...DEFAULT_BG_FILTERS },
      curiaFilters: { ...DEFAULT_CURIA_FILTERS },
    });
    setResults([]);
    setSubmitted(false);
    setLoading(false);
    setError(null);
    setSelectedResult(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildSearchPayload(form);
    if (!payload.query) {
      setSubmitted(true);
      setResults([]);
      setError("Моля, опишете какво търсите, за да започнем.");
      return;
    }

    setSubmitted(true);
    setLoading(true);
    setError(null);

    try {
      const response = await searchLegalActs(payload);
      setResults(response.results);
    } catch (err) {
      setResults([]);
      setError(userError(err, "Търсенето не можа да бъде изпълнено. Опитайте отново."));
    } finally {
      setLoading(false);
    }
  };

  const resultsTitle = loading
    ? "Търсим подходящи съдебни актове"
    : results.length > 0
      ? `Намерени ${results.length} резултата`
      : "Няма намерени резултати";

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <h1 className="text-2xl font-bold">
            Justic<span className="text-primary">IA</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Зареждане на страницата за търсене...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header user={user} onLogout={handleLogout} />

      <main className="container mx-auto max-w-5xl px-4 py-10">
        <div className="space-y-6">
          <Card className="border-2 border-primary/10 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Scale className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl md:text-4xl">Търсене на съдебни актове</CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7">
                  Намерете решения от ВКС, ВАС и Съда на Европейския съюз по тема,
                  казус или конкретен правен въпрос.
                </CardDescription>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Напишете с ваши думи какво ви интересува. Ако е нужно, уточнете
                  търсенето по съд, страна, година или друга позната информация.
                </p>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">Заявка и източници</CardTitle>
              <CardDescription>
                Въведете какво търсите и по желание стеснете резултатите с допълнителни
                уточнения.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="legal-query">Какво търсите</Label>
                  <Textarea
                    id="legal-query"
                    value={form.query}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, query: event.target.value }))
                    }
                    placeholder="Например: практика за отговорност на държавата при незаконосъобразен административен акт"
                    className="min-h-[160px] resize-y"
                  />
                  <p className="text-sm text-muted-foreground">
                    Опишете накратко казуса, правния въпрос или темата, която ви
                    интересува.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="source-selection">Къде да търсим</Label>
                    <Select
                      value={form.sourceSelection}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          sourceSelection: value as SourceSelection,
                        }))
                      }
                    >
                      <SelectTrigger id="source-selection">
                        <SelectValue placeholder="Изберете източници" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {selectedSourceOption?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="top-n">Колко резултата да покажем</Label>
                    <Select
                      value={form.topN}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, topN: value }))
                      }
                    >
                      <SelectTrigger id="top-n">
                        <SelectValue placeholder="Изберете брой резултати" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOP_N_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      По-малък брой е удобен за бърз преглед, а по-голям брой дава
                      по-широк избор.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">Избрани източници</p>
                  <div className="flex flex-wrap gap-2">
                    {activeSources.map((source) => (
                      <Badge key={source} className="bg-primary/10 text-primary hover:bg-primary/10">
                        {SOURCE_LABELS[source]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    className="gap-2 sm:flex-1"
                    disabled={loading || form.query.trim().length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Търсене...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Търси
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Изчисти
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {activeSources.includes("vks") && (
            <SearchFilterPanel
              title="Допълнително уточняване за ВКС"
              description="Попълнете само полетата, които знаете. Останалите може да оставите празни."
              fields={BG_FILTER_FIELDS}
              values={form.vksFilters}
              onChange={(field, value) => updateBgFilters("vksFilters", field, value)}
            />
          )}

          {activeSources.includes("vas") && (
            <SearchFilterPanel
              title="Допълнително уточняване за ВАС"
              description="Попълнете само полетата, които знаете. Останалите може да оставите празни."
              fields={BG_FILTER_FIELDS}
              values={form.vasFilters}
              onChange={(field, value) => updateBgFilters("vasFilters", field, value)}
            />
          )}

          {activeSources.includes("curia") && (
            <SearchFilterPanel
              title="Допълнително уточняване за СЕС"
              description="Попълнете само полетата, които знаете. Останалите може да оставите празни."
              fields={CURIA_FILTER_FIELDS}
              values={form.curiaFilters}
              onChange={updateCuriaFilters}
            />
          )}

          {submitted && (
            <section className="space-y-4">
              <Card className="border-border/80">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-2xl">{resultsTitle}</CardTitle>
                      <CardDescription className="mt-2 max-w-2xl">
                        {loading
                          ? "Подготвяме резултатите и кратките обобщения."
                          : "Резултатите са подредени така, че най-подходящите актове да са най-отгоре."}
                      </CardDescription>
                    </div>
                    {!loading && (
                      <div className="flex flex-wrap items-center gap-2">
                        {activeSources.map((source) => (
                          <Badge key={source} variant="outline">
                            {SOURCE_LABELS[source]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              <SearchResultsList
                loading={loading}
                submitted={submitted}
                error={error}
                results={results}
                query={form.query.trim()}
                onOpen={setSelectedResult}
              />
            </section>
          )}
        </div>
      </main>

      <SearchResultDetail
        open={Boolean(selectedResult)}
        result={selectedResult}
        onOpenChange={(open) => {
          if (!open) setSelectedResult(null);
        }}
      />
    </div>
  );
}
