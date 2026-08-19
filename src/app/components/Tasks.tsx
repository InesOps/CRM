import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, Calendar, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  collection, doc,
  getDocs, addDoc, updateDoc, deleteDoc,
  Timestamp, query, where
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../../hooks/useAuth";

type Priority = "high" | "medium" | "low";
type Column   = "todo" | "inprogress" | "review" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;       // owner uid — used to filter "my tasks"
  assigneeLabel: string;  // free-text initials shown on the card
  dueDate: string;
  tags: string[];
  column: Column;
}

const PRIORITY_STYLES: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: "Haute",   color: "#EF4444", bg: "#FEE2E2" },
  medium: { label: "Moyenne", color: "#F59E0B", bg: "#FEF3C7" },
  low:    { label: "Basse",   color: "#10B981", bg: "#D1FAE5" },
};

const ITEM_TYPE = "TASK";

// ── CRUD helpers ──────────────────────────────────────────────────────────────
const addTask    = (data: object)             => addDoc(collection(db, "tasks"), { ...data, createdAt: Timestamp.now() });
const updateTask = (id: string, data: object) => updateDoc(doc(db, "tasks", id), { ...data, updatedAt: Timestamp.now() });
const deleteTask = (id: string)               => deleteDoc(doc(db, "tasks", id));

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onDelete, onEdit }: {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: task.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(ref);

  const p = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;
  return (
    <div ref={ref} className="bg-card rounded-xl border border-border p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
      style={{ opacity: isDragging ? 0.4 : 1 }}>
      <div className="flex flex-wrap gap-1 mb-2">
        {(task.tags ?? []).map(t => (
          <span key={t} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#E2E8F0", color: "#475569" }}>{t}</span>
        ))}
        <span className="px-1.5 py-0.5 rounded text-xs font-medium ml-auto" style={{ background: p.bg, color: p.color }}>{p.label}</span>
      </div>
      <p className="text-sm font-medium text-foreground leading-snug mb-2">{task.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar size={11} />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}
          </span>
          {task.assigneeLabel && (
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: "var(--primary)", color: "white" }}>{task.assigneeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-muted transition-colors">
            <Edit2 size={12} className="text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-50 transition-colors">
            <Trash2 size={12} color="#EF4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────
function KanbanColumn({ col, tasks, onDrop, onDelete, onEdit }: {
  col: { id: Column; label: string; color: string; bg: string };
  tasks: Task[];
  onDrop: (id: string, col: Column) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string }) => onDrop(item.id, col.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });
  drop(ref);

  return (
    <div ref={ref} className="flex flex-col min-w-[260px] max-w-[300px] flex-1">
      <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-3" style={{ background: col.bg }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
          <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: col.color, color: "white" }}>{tasks.length}</span>
        </div>
        <MoreHorizontal size={14} style={{ color: col.color }} />
      </div>
      <div className="flex-1 space-y-3 rounded-xl p-2 min-h-[200px] transition-all"
        style={{
          background: isOver ? "rgba(37,99,235,0.04)" : "transparent",
          border: isOver ? "2px dashed #93C5FD" : "2px dashed transparent"
        }}>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function TaskModal({ task, saving, columns, onClose, onSave }: {
  task: Partial<Task>;
  saving: boolean;
  columns: { id: Column; label: string; color: string; bg: string }[];
  onClose: () => void;
  onSave: (t: Omit<Task, "id">) => void;
}) {
  const [form, setForm] = useState<Partial<Task>>(task);
  const set = (k: keyof Task, v: any) => setForm(f => ({ ...f, [k]: v }));
  const canSave = !!form.title?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">{task.id ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titre *</label>
            <input value={form.title || ""} onChange={e => set("title", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priorité</label>
              <select value={form.priority ?? "medium"} onChange={e => set("priority", e.target.value as Priority)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Colonne</label>
              <select value={form.column ?? "todo"} onChange={e => set("column", e.target.value as Column)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigné à</label>
              <input value={form.assigneeLabel || ""} onChange={e => set("assigneeLabel", e.target.value)}
                maxLength={3}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Échéance</label>
              <input type="date" value={form.dueDate || ""} onChange={e => set("dueDate", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({
              title:       form.title!,
              description: form.description ?? "",
              priority:    form.priority    ?? "medium",
              assignee:    form.assignee    ?? "",
              assigneeLabel: form.assigneeLabel ?? "",
              dueDate:     form.dueDate     ?? "",
              tags:        form.tags        ?? [],
              column:      form.column      ?? "todo",
            })}
            disabled={saving || !canSave}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90"
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
export function Tasks() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const COLUMNS: { id: Column; label: string; color: string; bg: string }[] = [
    { id: "todo",       label: "À faire",     color: "#64748B", bg: theme === "dark" ? "#1E293B" : "#F1F5F9" },
    { id: "inprogress", label: "En cours",    color: "#2563EB", bg: "#DBEAFE" },
    { id: "review",     label: "En révision", color: "#F59E0B", bg: "#FEF3C7" },
    { id: "done",       label: "Terminé",     color: "#10B981", bg: "#D1FAE5" },
  ];

  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [editingTask,   setEditingTask]   = useState<Partial<Task> | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);


  // READ — always scoped to the logged-in user's own tasks
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "tasks"), where("assignee", "==", user.uid));
        const snap = await getDocs(q);
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  // CREATE / UPDATE — new tasks are always assigned to the current user
  const handleSave = async (formData: Omit<Task, "id">, existingId?: string) => {
    setSaving(true);
    try {
      // Always keep the owner uid so "my tasks" filter (assignee == uid) still
      // matches after an edit — otherwise the task would vanish on reload.
      const payload = { ...formData, assignee: user!.uid };
      if (existingId) {
        await updateTask(existingId, payload);
        setTasks(ts => ts.map(t => t.id === existingId ? { id: existingId, ...payload } : t));
      } else {
        const ref = await addTask(payload);
        setTasks(ts => [...ts, { id: ref.id, ...payload }]);
      }
      setEditingTask(undefined);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // MOVE (drag & drop) — persists to Firestore
  const handleMove = async (id: string, col: Column) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, column: col } : t));
    try { await updateTask(id, { column: col }); }
    catch (e) { console.error(e); }
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-foreground">Tâches & Pipeline</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{tasks.length} tâches au total</p>
          </div>
          <button onClick={() => setEditingTask({ column: "todo", priority: "medium", tags: [] })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ background: "var(--primary)" }}>
            <Plus size={16} /> Nouvelle tâche
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" /><span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                tasks={tasks.filter(t => t.column === col.id)}
                onDrop={handleMove}
                onDelete={(id) => setDeleteConfirm(id)}
                onEdit={setEditingTask}
              />
            ))}
          </div>
        )}
      </div>

      {editingTask !== undefined && (
        <TaskModal
          task={editingTask}
          saving={saving}
          columns={COLUMNS}
          onClose={() => setEditingTask(undefined)}
          onSave={(data) => handleSave(data, editingTask.id)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-foreground mb-2">Supprimer la tâche</h2>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: "#EF4444" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}