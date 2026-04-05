import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatValue,
  getFullDocumentEntries,
  getMetadataEntries,
  getResultTitle,
  getSummaryText,
  SOURCE_LABELS,
  type SearchResult,
} from "@/lib/legal-search";

interface SearchResultDetailProps {
  open: boolean;
  result: SearchResult | null;
  onOpenChange: (open: boolean) => void;
}

function DetailSections({ result }: { result: SearchResult }) {
  const metadataEntries = getMetadataEntries(result.metadata);
  const fullDocument = getFullDocumentEntries(result.fullDocument);
  const description =
    typeof result.description === "string" && result.description.trim().length > 0
      ? result.description.trim()
      : "";

  return (
    <div className="space-y-6 overflow-y-auto px-1 py-1">
      <Card className="border-border/80">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {SOURCE_LABELS[result.source]}
            </Badge>
            <Badge variant="outline">№ {result.rank}</Badge>
          </div>
          <CardTitle className="text-2xl leading-snug">{getResultTitle(result)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Резюме
            </p>
            <p className="text-sm leading-7">{getSummaryText(result)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Метаданни</CardTitle>
        </CardHeader>
        <CardContent>
          {metadataEntries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {metadataEntries.map((entry) => (
                <div key={entry.key} className="rounded-lg border border-border/80 bg-background p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{entry.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Няма налични метаданни.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Описание</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
              {description || "Няма налично описание за този резултат."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Пълен документ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fullDocument.compact.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {fullDocument.compact.map((entry) => (
                <div key={entry.key} className="rounded-lg border border-border/80 bg-background p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{entry.value}</p>
                </div>
              ))}
            </div>
          )}

          {fullDocument.longText.length > 0 && (
            <div className="space-y-3">
              {fullDocument.longText.map((entry) => (
                <div key={entry.key} className="rounded-lg border border-border/80 bg-muted/30 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {fullDocument.compact.length === 0 && fullDocument.longText.length === 0 && (
            <p className="text-sm text-muted-foreground">Няма допълнителни данни за документа.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SearchResultDetail({
  open,
  result,
  onOpenChange,
}: SearchResultDetailProps) {
  const isMobile = useIsMobile();

  if (!result) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{getResultTitle(result)}</DrawerTitle>
            <DrawerDescription>
              {SOURCE_LABELS[result.source]} • детайлен преглед на съдебния акт
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[72vh] overflow-y-auto px-4 pb-2">
            <DetailSections result={result} />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Затвори</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-border/80 p-0 sm:rounded-xl">
        <div className="grid max-h-[88vh] grid-rows-[auto,1fr,auto]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="text-2xl">{getResultTitle(result)}</DialogTitle>
            <DialogDescription>
              {SOURCE_LABELS[result.source]} • детайлен преглед на съдебния акт
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-6">
            <DetailSections result={result} />
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Затвори
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
