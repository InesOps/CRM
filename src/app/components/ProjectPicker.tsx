import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X, FolderKanban } from "lucide-react";
import { getProjects } from "../../firebase/crud/projects";

export interface ProjectOption {
  id: string;
  name: string;
}

/** Loads the projects collection once and exposes a name lookup. */
export function useProjects() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    getProjects()
      .then(snap => setProjects(snap.docs.map(d => ({ id: d.id, name: (d.data() as any).name ?? "" }))))
      .catch(e => console.error(e));
  }, []);

  const nameOf = (id: string) => projects.find(p => p.id === id)?.name ?? "";
  return { projects, nameOf };
}

/** Multi-select of project names (values stored as project ids). */
export function ProjectMultiSelect({
  projects, value, onChange,
}: {
  projects: ProjectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
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

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

  const selected = projects.filter(p => value.includes(p.id));

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
        <span className="flex flex-wrap gap-1.5 items-center min-h-[1.25rem]">
          {selected.length === 0
            ? <span className="text-muted-foreground">Sélectionner des projets…</span>
            : selected.map(p => (
                <span key={p.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border">
                  {p.name}
                  <span onClick={e => { e.stopPropagation(); toggle(p.id); }} className="text-muted-foreground hover:text-red-400">
                    <X size={10} />
                  </span>
                </span>
              ))}
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-card border border-border rounded-lg shadow-xl">
          {projects.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">Aucun projet. Créez-en dans la page Projets.</div>
          ) : projects.map(p => {
            const checked = value.includes(p.id);
            return (
              <button key={p.id} type="button" onClick={() => toggle(p.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors">
                <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                  style={{ background: checked ? "var(--primary)" : "transparent", borderColor: checked ? "var(--primary)" : "var(--border)" }}>
                  {checked && <Check size={11} color="white" />}
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Read-only chips listing selected project names. */
export function ProjectChips({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map(n => (
        <span key={n} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border text-foreground">
          <FolderKanban size={10} className="text-muted-foreground" />{n}
        </span>
      ))}
    </div>
  );
}
