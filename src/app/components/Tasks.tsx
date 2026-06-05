import { useState, useRef } from "react";
import { Plus, MoreHorizontal, Calendar, User, Tag, Trash2, Edit2, Check, X } from "lucide-react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type Priority = "high" | "medium" | "low";
type Column = "todo" | "inprogress" | "review" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  dueDate: string;
  tags: string[];
  column: Column;
}

const COLUMNS: { id: Column; label: string; color: string; bg: string }[] = [
  { id: "todo", label: "À faire", color: "#64748B", bg: "#F1F5F9" },
  { id: "inprogress", label: "En cours", color: "#2563EB", bg: "#DBEAFE" },
  { id: "review", label: "En révision", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "done", label: "Terminé", color: "#10B981", bg: "#D1FAE5" },
];

const PRIORITY_STYLES: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: "Haute", color: "#EF4444", bg: "#FEE2E2" },
  medium: { label: "Moyenne", color: "#F59E0B", bg: "#FEF3C7" },
  low: { label: "Basse", color: "#10B981", bg: "#D1FAE5" },
};

const initTasks: Task[] = [
  { id: "t1", title: "Relancer le devis Groupe Mrabet", description: "Envoyer le devis révisé avec les nouvelles conditions", priority: "high", assignee: "AS", dueDate: "2026-06-07", tags: ["Devis", "Urgent"], column: "todo" },
  { id: "t2", title: "Préparer réunion Innovatech Tunisie", description: "Préparer la présentation produit et les slides", priority: "medium", assignee: "MB", dueDate: "2026-06-10", tags: ["Réunion"], column: "todo" },
  { id: "t3", title: "Mise à jour CRM contacts", description: "Synchroniser les contacts importés depuis le fichier Excel", priority: "low", assignee: "AS", dueDate: "2026-06-15", tags: ["Admin"], column: "todo" },
  { id: "t4", title: "Contrat Chaouachi — signature", description: "Finaliser et envoyer le contrat pour signature électronique", priority: "high", assignee: "AS", dueDate: "2026-06-06", tags: ["Contrat"], column: "inprogress" },
  { id: "t5", title: "Analyse concurrentielle Q2", description: "Benchmarking des offres concurrentes sur le marché tunisien", priority: "medium", assignee: "YB", dueDate: "2026-06-20", tags: ["Stratégie"], column: "inprogress" },
  { id: "t6", title: "Rapport mensuel mai", description: "Compiler les KPIs et rédiger le rapport de performance", priority: "medium", assignee: "MB", dueDate: "2026-06-05", tags: ["Reporting"], column: "review" },
  { id: "t7", title: "Intégration nouvel outil marketing", description: "Connecter la plateforme emailing au pipeline CRM", priority: "low", assignee: "YB", dueDate: "2026-06-25", tags: ["Technique"], column: "review" },
  { id: "t8", title: "Formation équipe nouveau CRM", description: "Session de formation de 2h pour l'équipe commerciale", priority: "high", assignee: "AS", dueDate: "2026-06-01", tags: ["Formation"], column: "done" },
  { id: "t9", title: "Campagne email Juin", description: "Mise en place de la campagne de prospection juin", priority: "medium", assignee: "MB", dueDate: "2026-06-02", tags: ["Marketing"], column: "done" },
];

const ITEM_TYPE = "TASK";

function TaskCard({ task, onMove, onDelete, onEdit }: { task: Task; onMove: (id: string, col: Column) => void; onDelete: (id: string) => void; onEdit: (task: Task) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: task.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(ref);

  const p = PRIORITY_STYLES[task.priority];
  return (
    <div ref={ref} className="bg-card rounded-xl border border-border p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all" style={{ opacity: isDragging ? 0.4 : 1 }}>
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {task.tags.map((t) => (
          <span key={t} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#E2E8F0", color: "#475569" }}>{t}</span>
        ))}
        <span className="px-1.5 py-0.5 rounded text-xs font-medium ml-auto" style={{ background: p.bg, color: p.color }}>{p.label}</span>
      </div>
      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug mb-2">{task.title}</p>
      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{task.description}</p>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={11} />
            {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "var(--primary)", color: "white" }}>
            {task.assignee}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-muted transition-colors" title="Modifier">
            <Edit2 size={12} className="text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-50 transition-colors" title="Supprimer">
            <Trash2 size={12} color="#EF4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ col, tasks, onDrop, onDelete, onEdit }: { col: typeof COLUMNS[0]; tasks: Task[]; onDrop: (id: string, col: Column) => void; onDelete: (id: string) => void; onEdit: (t: Task) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string }) => onDrop(item.id, col.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });
  drop(ref);

  return (
    <div ref={ref} className="flex flex-col min-w-[260px] max-w-[300px] flex-1" style={{ transition: "background 0.15s" }}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-3" style={{ background: col.bg }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: col.color }}></div>
          <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: col.color, color: "white" }}>{tasks.length}</span>
        </div>
        <MoreHorizontal size={14} style={{ color: col.color }} />
      </div>

      {/* Drop zone */}
      <div className="flex-1 space-y-3 rounded-xl p-2 min-h-[200px] transition-all" style={{ background: isOver ? "rgba(37,99,235,0.04)" : "transparent", border: isOver ? "2px dashed #93C5FD" : "2px dashed transparent" }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMove={onDrop} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function TaskModal({ task, onClose, onSave }: { task: Partial<Task> | null; onClose: () => void; onSave: (t: Task) => void }) {
  const [form, setForm] = useState<Partial<Task>>(task || { column: "todo", priority: "medium", tags: [] });
  if (!task && task !== null) return null;

  const handleSave = () => {
    if (!form.title) return;
    onSave({
      id: form.id || `t${Date.now()}`,
      title: form.title || "",
      description: form.description || "",
      priority: form.priority || "medium",
      assignee: form.assignee || "AL",
      dueDate: form.dueDate || new Date().toISOString().split("T")[0],
      tags: form.tags || [],
      column: form.column || "todo",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">{form.id ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titre *</label>
            <input value={form.title || ""} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" placeholder="Titre de la tâche" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <textarea value={form.description || ""} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-none" rows={3} placeholder="Description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priorité</label>
              <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Priority }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colonne</label>
              <select value={form.column} onChange={(e) => setForm(f => ({ ...f, column: e.target.value as Column }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigné à</label>
              <input value={form.assignee || ""} onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Initiales (ex: AL)" maxLength={3} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Échéance</label>
              <input type="date" value={form.dueDate || ""} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Annuler</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2" style={{ background: "var(--primary)" }}>
            <Check size={14} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initTasks);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null | undefined>(undefined);

  const handleMove = (id: string, col: Column) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, column: col } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  const handleSave = (task: Task) => {
    setTasks(ts => {
      const idx = ts.findIndex(t => t.id === task.id);
      if (idx >= 0) return ts.map(t => t.id === task.id ? task : t);
      return [...ts, task];
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-foreground">Tâches & Pipeline</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{tasks.length} tâches au total</p>
          </div>
          <button
            onClick={() => setEditingTask({})}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={16} /> Nouvelle tâche
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              col={col}
              tasks={tasks.filter(t => t.column === col.id)}
              onDrop={handleMove}
              onDelete={handleDelete}
              onEdit={setEditingTask}
            />
          ))}
        </div>
      </div>

      {editingTask !== undefined && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(undefined)} onSave={handleSave} />
      )}
    </DndProvider>
  );
}
