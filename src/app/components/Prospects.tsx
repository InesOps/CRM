import { useState, useEffect } from "react";
import { Plus, Phone, Mail, Edit2, Trash2, Check, X, ChevronRight, ArrowRight, Loader2 } from "lucide-react";
import {
  getProspects,
  addProspect,
  updateProspect,
  deleteProspect,
  getNextProspectId,
} from "../../firebase/crud/prospects";

type Stage = "identification" | "qualification" | "proposition" | "negociation" | "gagne" | "perdu";

interface Prospect {
  id: string;
  prospectId: number;
  Name: string;
  Lastname: string;
  company: string;
  email: string;
  phone: string;
  stage: Stage;
  value: number;
  probability: number;
  assignee: string;
  nextAction: string;
  nextActionDate: string;
  source: string;
  notes: string;
  type: "prospect";
}

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: "identification", label: "Identification", color: "#94A3B8", bg: "#F1F5F9" },
  { id: "qualification",  label: "Qualification",  color: "#F59E0B", bg: "#FEF3C7" },
  { id: "proposition",    label: "Proposition",    color: "#2563EB", bg: "#DBEAFE" },
  { id: "negociation",    label: "Négociation",    color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "gagne",          label: "Gagné",          color: "#10B981", bg: "#D1FAE5" },
  { id: "perdu",          label: "Perdu",          color: "#EF4444", bg: "#FEE2E2" },
];

const emptyForm = (): Partial<Prospect> => ({
  Name: "", Lastname: "", company: "", email: "", phone: "",
  stage: "identification", value: 0, probability: 20,
  assignee: "", nextAction: "", nextActionDate: "",
  source: "", notes: "", type: "prospect",
});

// ── Modal ─────────────────────────────────────────────────────────────────────
function ProspectModal({
  prospect, saving, onClose, onSave,
}: {
  prospect: Partial<Prospect>;
  saving: boolean;
  onClose: () => void;
  onSave: (p: Omit<Prospect, "id" | "prospectId">) => void;
}) {
  const [form, setForm] = useState<Partial<Prospect>>(prospect);
  const set = (k: keyof Prospect, v: any) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.Name?.trim() && form.company?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">{prospect.id ? "Modifier le prospect" : "Nouveau prospect"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} className="text-muted-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prénom *</label>
            <input value={form.Name || ""} onChange={e => set("Name", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom</label>
            <input value={form.Lastname || ""} onChange={e => set("Lastname", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entreprise *</label>
            <input value={form.company || ""} onChange={e => set("company", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
            <input value={form.phone || ""} onChange={e => set("phone", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Étape</label>
            <select value={form.stage} onChange={e => set("stage", e.target.value as Stage)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</label>
            <input value={form.source || ""} onChange={e => set("source", e.target.value)}
              placeholder="LinkedIn, Salon, Recommandation…"
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valeur (DT)</label>
            <input type="number" value={form.value || ""} onChange={e => set("value", Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Probabilité (%)</label>
            <input type="number" min={0} max={100} value={form.probability || ""} onChange={e => set("probability", Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigné à</label>
            <input value={form.assignee || ""} onChange={e => set("assignee", e.target.value)}
              placeholder="Initiales" maxLength={3}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prochaine action</label>
            <input value={form.nextAction || ""} onChange={e => set("nextAction", e.target.value)}
              placeholder="Appel, Démo, Envoyer devis…"
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date prochaine action</label>
            <input type="date" value={form.nextActionDate || ""} onChange={e => set("nextActionDate", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={2} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({
              Name:           form.Name!,
              Lastname:       form.Lastname    ?? "",
              company:        form.company!,
              email:          form.email       ?? "",
              phone:          form.phone       ?? "",
              stage:          form.stage       ?? "identification",
              value:          form.value       ?? 0,
              probability:    form.probability ?? 20,
              assignee:       form.assignee    ?? "",
              nextAction:     form.nextAction  ?? "",
              nextActionDate: form.nextActionDate ?? "",
              source:         form.source      ?? "",
              notes:          form.notes       ?? "",
              type:           "prospect",
            })}
            disabled={saving || !canSave}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function Prospects() {
  const [prospects,       setProspects]       = useState<Prospect[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [stageFilter,     setStageFilter]     = useState<Stage | "all">("all");
  const [editingProspect, setEditingProspect] = useState<Partial<Prospect> | undefined>(undefined);
  const [deleteConfirm,   setDeleteConfirm]   = useState<Prospect | null>(null);

  // READ
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getProspects();
        setProspects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prospect)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // CREATE / UPDATE
  const handleSave = async (
    formData: Omit<Prospect, "id" | "prospectId">,
    existing?: Partial<Prospect>
  ) => {
    setSaving(true);
    try {
      if (existing?.id) {
        // UPDATE
        await updateProspect(existing.id, { ...formData, prospectId: existing.prospectId });
        setProspects(ps => ps.map(p =>
          p.id === existing.id ? { ...p, ...formData, prospectId: existing.prospectId! } : p
        ));
      } else {
        // CREATE — getNextProspectId is called inside addProspect
        const ref = await addProspect(formData);
        // Re-fetch the doc to get the prospectId assigned by addProspect
        const snap = await getProspects();
        const newDoc = snap.docs.find(d => d.id === ref.id);
        if (newDoc) {
          setProspects(ps => [...ps, { id: newDoc.id, ...newDoc.data() } as Prospect]
            .sort((a, b) => (a.prospectId ?? 0) - (b.prospectId ?? 0)));
        }
      }
      setEditingProspect(undefined);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ADVANCE STAGE
  const advanceStage = async (p: Prospect) => {
    const idx = STAGES.findIndex(s => s.id === p.stage);
    if (idx < STAGES.length - 2) {
      const nextStage = STAGES[idx + 1].id;
      try {
        await updateProspect(p.id, { stage: nextStage });
        setProspects(ps => ps.map(x => x.id === p.id ? { ...x, stage: nextStage } : x));
      } catch (e) { console.error(e); }
    }
  };

  // DELETE
  const handleDelete = async (prospect: Prospect) => {
    try {
      await deleteProspect(prospect.id);
      setProspects(ps => ps.filter(p => p.id !== prospect.id));
    } catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const filtered = prospects.filter(p => stageFilter === "all" || p.stage === stageFilter);

  const totalPipeline    = prospects.filter(p => p.stage !== "perdu").reduce((s, p) => s + (p.value ?? 0), 0);
  const weightedPipeline = prospects.filter(p => p.stage !== "perdu").reduce((s, p) => s + (p.value ?? 0) * (p.probability ?? 0) / 100, 0);
  const wonValue         = prospects.filter(p => p.stage === "gagne").reduce((s, p) => s + (p.value ?? 0), 0);

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-foreground">Prospects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{prospects.length} prospects dans le pipeline</p>
        </div>
        <button onClick={() => setEditingProspect(emptyForm())}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
          style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Nouveau prospect
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Pipeline total</p>
          <p className="text-xl font-semibold text-foreground">{totalPipeline.toLocaleString("fr-FR")} DT</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Pipeline pondéré</p>
          <p className="text-xl font-semibold" style={{ color: "var(--primary)" }}>{Math.round(weightedPipeline).toLocaleString("fr-FR")} DT</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Deals gagnés</p>
          <p className="text-xl font-semibold" style={{ color: "#10B981" }}>{wonValue.toLocaleString("fr-FR")} DT</p>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setStageFilter("all")} className="px-3 py-1.5 rounded-lg text-sm transition-all border"
          style={{ background: stageFilter === "all" ? "var(--primary)" : "var(--card)", color: stageFilter === "all" ? "white" : "var(--muted-foreground)", borderColor: stageFilter === "all" ? "var(--primary)" : "var(--border)" }}>
          Tous ({prospects.length})
        </button>
        {STAGES.map(s => {
          const count = prospects.filter(p => p.stage === s.id).length;
          return (
            <button key={s.id} onClick={() => setStageFilter(s.id)} className="px-3 py-1.5 rounded-lg text-sm transition-all border"
              style={{ background: stageFilter === s.id ? s.color : s.bg, color: stageFilter === s.id ? "white" : s.color, borderColor: stageFilter === s.id ? s.color : "transparent" }}>
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" /><span className="text-sm">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-12">Aucun prospect dans cette étape</div>
        ) : (
          filtered.map(p => {
            const st = STAGES.find(s => s.id === p.stage)!;
            const canAdvance = p.stage !== "gagne" && p.stage !== "perdu";
            const fullName = `${p.Name ?? ""} ${p.Lastname ?? ""}`.trim();
            const initials = `${p.Name?.[0] ?? ""}${p.Lastname?.[0] ?? ""}`.toUpperCase() || "?";

            return (
              <div key={p.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: st.bg, color: st.color }}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{fullName}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          {p.prospectId && <span className="text-xs font-mono text-muted-foreground">#{p.prospectId}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.company}{p.source ? ` · Source: ${p.source}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{(p.value ?? 0).toLocaleString("fr-FR")} DT</p>
                        <p className="text-xs text-muted-foreground">{p.probability ?? 0}% prob.</p>
                      </div>
                    </div>

                    <div className="my-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.probability ?? 0}%`, background: st.color }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1 hover:text-primary"><Mail size={11} />{p.email}</a>}
                        {p.phone && <span className="flex items-center gap-1"><Phone size={11} />{p.phone}</span>}
                        {p.nextAction && (
                          <span className="flex items-center gap-1 text-foreground font-medium">
                            <ArrowRight size={11} />{p.nextAction}
                            {p.nextActionDate && (
                              <span className="text-muted-foreground font-normal">
                                — {new Date(p.nextActionDate + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {canAdvance && (
                          <button onClick={() => advanceStage(p)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:opacity-90"
                            style={{ background: st.bg, color: st.color }}>
                            Avancer <ChevronRight size={11} />
                          </button>
                        )}
                        <button onClick={() => setEditingProspect(p)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Edit2 size={12} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={12} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingProspect !== undefined && (
        <ProspectModal
          prospect={editingProspect}
          saving={saving}
          onClose={() => setEditingProspect(undefined)}
          onSave={(data) => handleSave(data, editingProspect)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-foreground mb-2">Supprimer le prospect</h2>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: "#EF4444" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}