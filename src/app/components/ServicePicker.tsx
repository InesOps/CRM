import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X, Wrench } from "lucide-react";

export const SERVICE_OPTIONS = [
  "cadrage besoins clients",
  "conception et adaptation",
  "installation et paramétrage",
  "interfaçage",
  "migration",
  "formation équipe",
  "assistance exploitation",
  "maintenance",
];

/** Accepts legacy string values or arrays and always returns a string[]. */
export function toServiceArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean) as string[];
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

/** Multi-select of predefined service types. */
export function ServiceMultiSelect({
  value, onChange,
}: {
  value: string[];
  onChange: (services: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = (s: string) =>
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
        <span className="flex flex-wrap gap-1.5 items-center min-h-[1.25rem]">
          {value.length === 0
            ? <span className="text-muted-foreground">Sélectionner des services…</span>
            : value.map(s => (
                <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border capitalize">
                  {s}
                  <span onClick={e => { e.stopPropagation(); toggle(s); }} className="text-muted-foreground hover:text-red-400">
                    <X size={10} />
                  </span>
                </span>
              ))}
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-card border border-border rounded-lg shadow-xl">
          {SERVICE_OPTIONS.map(s => {
            const checked = value.includes(s);
            return (
              <button key={s} type="button" onClick={() => toggle(s)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors capitalize">
                <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                  style={{ background: checked ? "var(--primary)" : "transparent", borderColor: checked ? "var(--primary)" : "var(--border)" }}>
                  {checked && <Check size={11} color="white" />}
                </span>
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Read-only chips listing selected services. */
export function ServiceChips({ services }: { services: string[] }) {
  if (services.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {services.map(s => (
        <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border text-foreground capitalize">
          <Wrench size={10} className="text-muted-foreground" />{s}
        </span>
      ))}
    </div>
  );
}
