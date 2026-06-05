import { useState } from "react";
import { Plus, TrendingUp, Euro, Phone, Mail, MoreHorizontal, Edit2, Trash2, Check, X, ChevronRight, ArrowRight } from "lucide-react";

type Stage = "identification" | "qualification" | "proposition" | "negociation" | "gagne" | "perdu";

interface Prospect {
  id: string;
  name: string;
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
}

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: "identification", label: "Identification", color: "#94A3B8", bg: "#F1F5F9" },
  { id: "qualification", label: "Qualification", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "proposition", label: "Proposition", color: "#2563EB", bg: "#DBEAFE" },
  { id: "negociation", label: "Négociation", color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "gagne", label: "Gagné", color: "#10B981", bg: "#D1FAE5" },
  { id: "perdu", label: "Perdu", color: "#EF4444", bg: "#FEE2E2" },
];

const initProspects: Prospect[] = [
  { id: "p1", name: "Sirine Rekik", company: "Innovatech Tunisie", email: "s.rekik@innovatech.tn", phone: "+216 55 345 678", stage: "negociation", value: 115500, probability: 70, assignee: "AS", nextAction: "Envoyer contrat révisé", nextActionDate: "2026-06-08", source: "Recommandation", notes: "Très intéressée par le module reporting" },
  { id: "p2", name: "Tarek Ben Youssef", company: "TechVentures Tunis", email: "t.benyoussef@techventures.tn", phone: "+216 22 456 789", stage: "proposition", value: 59400, probability: 45, assignee: "MB", nextAction: "Démo produit", nextActionDate: "2026-06-11", source: "LinkedIn", notes: "Hésitation sur le pricing" },
  { id: "p3", name: "Ines Jlassi", company: "DataFlow Tunisie", email: "i.jlassi@dataflow.tn", phone: "+216 53 901 234", stage: "qualification", value: 171600, probability: 30, assignee: "YB", nextAction: "Appel de qualification", nextActionDate: "2026-06-09", source: "Salon professionnel", notes: "Budget non confirmé" },
  { id: "p4", name: "Bilel Sassi", company: "Retail Plus Tunisie", email: "b.sassi@retailplus.tn", phone: "+216 98 112 233", stage: "identification", value: 39600, probability: 15, assignee: "AS", nextAction: "Premier contact", nextActionDate: "2026-06-12", source: "Cold email", notes: "" },
  { id: "p5", name: "Sana Ben Ali", company: "FinServ Tunisie", email: "s.benali@finserv.tn", phone: "+216 55 667 788", stage: "gagne", value: 135300, probability: 100, assignee: "AS", nextAction: "Onboarding", nextActionDate: "2026-06-15", source: "Référence client", notes: "Contrat signé le 2 juin" },
  { id: "p6", name: "Walid Boughanmi", company: "MediGroup Tunis", email: "w.boughanmi@medigroup.tn", phone: "+216 99 334 455", stage: "perdu", value: 92400, probability: 0, assignee: "MB", nextAction: "—", nextActionDate: "", source: "Website", notes: "A choisi un concurrent" },
];

function ProspectModal({ prospect, onClose, onSave }: { prospect: Partial<Prospect> | null; onClose: () => void; onSave: (p: Prospect) => void }) {
  const [form, setForm] = useState<Partial<Prospect>>(prospect || { stage: "identification", probability: 20, source: "LinkedIn" });
  const handleSave = () => {
    if (!form.name || !form.company) return;
    onSave({ id: form.id || `p${Date.now()}`, name: form.name, company: form.company, email: form.email || "", phone: form.phone || "", stage: form.stage || "identification", value: form.value || 0, probability: form.probability || 20, assignee: form.assignee || "AL", nextAction: form.nextAction || "", nextActionDate: form.nextActionDate || "", source: form.source || "", notes: form.notes || "" });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2>{form.id ? "Modifier le prospect" : "Nouveau prospect"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom *</label>
            <input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entreprise *</label>
            <input value={form.company || ""} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
            <input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Étape</label>
            <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</label>
            <input value={form.source || ""} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="LinkedIn, Salon, Recommandation…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valeur (€)</label>
            <input type="number" value={form.value || ""} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Probabilité (%)</label>
            <input type="number" min={0} max={100} value={form.probability || ""} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prochaine action</label>
            <input value={form.nextAction || ""} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Appel, Démo, Envoyer devis…" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date prochaine action</label>
            <input type="date" value={form.nextActionDate || ""} onChange={e => setForm(f => ({ ...f, nextActionDate: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigné à</label>
            <input value={form.assignee || ""} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Initiales" maxLength={3} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={2} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Annuler</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90" style={{ background: "var(--primary)" }}>
            <Check size={14} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export function Prospects() {
  const [prospects, setProspects] = useState<Prospect[]>(initProspects);
  const [editingProspect, setEditingProspect] = useState<Partial<Prospect> | null | undefined>(undefined);
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");

  const filtered = prospects.filter(p => stageFilter === "all" || p.stage === stageFilter);

  const handleSave = (p: Prospect) => {
    setProspects(ps => {
      const idx = ps.findIndex(x => x.id === p.id);
      return idx >= 0 ? ps.map(x => x.id === p.id ? p : x) : [...ps, p];
    });
  };

  const totalPipeline = prospects.filter(p => p.stage !== "perdu").reduce((sum, p) => sum + p.value, 0);
  const weightedPipeline = prospects.filter(p => p.stage !== "perdu").reduce((sum, p) => sum + p.value * p.probability / 100, 0);
  const wonValue = prospects.filter(p => p.stage === "gagne").reduce((sum, p) => sum + p.value, 0);

  const advanceStage = (p: Prospect) => {
    const idx = STAGES.findIndex(s => s.id === p.stage);
    if (idx < STAGES.length - 2) {
      const nextStage = STAGES[idx + 1].id;
      setProspects(ps => ps.map(x => x.id === p.id ? { ...x, stage: nextStage } : x));
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-foreground">Prospects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{prospects.length} prospects dans le pipeline</p>
        </div>
        <button onClick={() => setEditingProspect({})} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-colors" style={{ background: "var(--primary)" }}>
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
        <button onClick={() => setStageFilter("all")} className="px-3 py-1.5 rounded-lg text-sm transition-all border" style={{ background: stageFilter === "all" ? "var(--primary)" : "var(--card)", color: stageFilter === "all" ? "white" : "var(--muted-foreground)", borderColor: stageFilter === "all" ? "var(--primary)" : "var(--border)" }}>
          Tous ({prospects.length})
        </button>
        {STAGES.map(s => {
          const count = prospects.filter(p => p.stage === s.id).length;
          return (
            <button key={s.id} onClick={() => setStageFilter(s.id)} className="px-3 py-1.5 rounded-lg text-sm transition-all border" style={{ background: stageFilter === s.id ? s.color : s.bg, color: stageFilter === s.id ? "white" : s.color, borderColor: stageFilter === s.id ? s.color : "transparent" }}>
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Prospects list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filtered.map(p => {
          const st = STAGES.find(s => s.id === p.stage)!;
          const canAdvance = p.stage !== "gagne" && p.stage !== "perdu";
          return (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: st.bg, color: st.color }}>
                  {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.company} · Source: {p.source}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{p.value.toLocaleString("fr-FR")} DT</p>
                        <p className="text-xs text-muted-foreground">{p.probability}% prob.</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="my-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.probability}%`, background: st.color }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <a href={`mailto:${p.email}`} className="flex items-center gap-1 hover:text-primary"><Mail size={11} />{p.email}</a>
                      <span className="flex items-center gap-1"><Phone size={11} />{p.phone}</span>
                      {p.nextAction && <span className="flex items-center gap-1 text-foreground font-medium"><ArrowRight size={11} />{p.nextAction} {p.nextActionDate && <span className="text-muted-foreground font-normal">— {new Date(p.nextActionDate + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {canAdvance && (
                        <button onClick={() => advanceStage(p)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:opacity-90 transition-colors" style={{ background: st.bg, color: st.color }}>
                          Avancer <ChevronRight size={11} />
                        </button>
                      )}
                      <button onClick={() => setEditingProspect(p)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Edit2 size={12} className="text-muted-foreground" /></button>
                      <button onClick={() => setProspects(ps => ps.filter(x => x.id !== p.id))} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={12} color="#EF4444" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-12">Aucun prospect dans cette étape</div>}
      </div>

      {editingProspect !== undefined && (
        <ProspectModal prospect={editingProspect} onClose={() => setEditingProspect(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}
