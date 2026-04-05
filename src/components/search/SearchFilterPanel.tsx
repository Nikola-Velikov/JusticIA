import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type FilterFieldConfig } from "@/lib/legal-search";

interface SearchFilterPanelProps<T extends string> {
  title: string;
  description: string;
  fields: FilterFieldConfig<T>[];
  values: Record<T, string>;
  onChange: (field: T, value: string) => void;
}

export function SearchFilterPanel<T extends string>({
  title,
  description,
  fields,
  values,
  onChange,
}: SearchFilterPanelProps<T>) {
  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${title}-${field.key}`}>{field.label}</Label>
              <Input
                id={`${title}-${field.key}`}
                type={field.type || "text"}
                inputMode={field.type === "number" ? "numeric" : undefined}
                value={values[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
