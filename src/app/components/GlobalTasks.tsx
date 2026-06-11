import { useState, useEffect } from "react";
import { ClipboardList, Plus, Check, X, Loader2, ChevronDown } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { getAllStaff, type StaffMember } from "../../firebase/crud/users";
import { getTasks, addTask, updateTask } from "../../firebase/crud/tasks";

type Column = "todo" | "inprogress" | "review" | "done";
type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  column: Column;
  assignee?: string;
  tags?: string[];
}

const COL_LABELS: Record<Column, string> = {
  todo:       "À faire",
  inprogress: "En cours",
  review:     "En révision",
  done:       "Terminé",
};

const PRIORITY_STYLES: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: "Haute",   color: "#EF4444", bg: "#FEE2E2" },
  medium: { label: "Moyenne", color: "#F59E0B", bg: "#FEF3C7" },
  low:    { label: "Basse",   color: "#10B981", bg: "#D1FAE5" },
};

function AssignTaskModal({ agents, onClose, onSave, saving }: {
  agents: StaffMember[];
  onClose: () => void;
  onSave: (task: Omit<Task, "id">) => void;
  saving: boolean;
}) {
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate,  setDueDate]  = useState("");
  const [assignee, setAssignee] = useState(agents[0]?.uid ?? "");

  const canSave = title.trim() && assignee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">Assigner une tâche</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titre *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigner à *</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {agents.map(a => {
                const name = [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email;
                return <option key={a.uid} value={a.uid}>{name}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
            Annuler
          </button>
          <button
            onClick={() => onSave({ title, description: desc, priority, dueDate, column: "todo", assignee, tags: [] })}
            disabled={!canSave || saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Assigner
          </button>
        </div>
      </div>
    </div>
  );
}

export function GlobalTasks() {
  const [agents,       setAgents]       = useState<StaffMember[]>([]);
  const [selectedUid,  setSelectedUid]  = useState<string>("all");
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showAssign,   setShowAssign]   = useState(false);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    getAllStaff().then(all => {
      const agentList = all.filter(m => m.role === "agent");
      setAgents(agentList);
    });
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const uid = selectedUid === "all" ? undefined : selectedUid;
    const all = await getTasks(uid) as Task[];
    setTasks(all);
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, [selectedUid]);

  const handleAssign = async (taskData: Omit<Task, "id">) => {
    setSaving(true);
    await addTask(taskData);
    setShowAssign(false);
    setSaving(false);
    await loadTasks();
  };

  const selectedAgent = agents.find(a => a.uid === selectedUid);

  const done    = tasks.filter(t => t.column === "done");
  const pending = tasks.filter(t => t.column !== "done");

  const getAgentName = (uid?: string) => {
    if (!uid) return "—";
    const a = agents.find(x => x.uid === uid);
    return a ? ([a.firstName, a.lastName].filter(Boolean).join(" ") || a.email) : uid;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Tâches globales</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Suivi et assignation des tâches de l'équipe
          </p>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={14} />
          Assigner une tâche
        </button>
      </div>

      {/* Agent selector */}
      <div className="flex items-center gap-3">
        <ClipboardList size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Afficher les tâches de :</span>
        <div className="relative">
          <select
            value={selectedUid}
            onChange={e => setSelectedUid(e.target.value)}
            className="pl-3 pr-8 py-2 border border-border rounded-xl text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
          >
            <option value="all">Toute l'équipe</option>
            {agents.map(a => {
              const name = [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email;
              return <option key={a.uid} value={a.uid}>{name}</option>;
            })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-2xl font-semibold text-foreground">{tasks.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tâches totales</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-2xl font-semibold text-foreground">{pending.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">En cours</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-2xl font-semibold text-foreground">{done.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Terminées</p>
            </div>
          </div>

          {/* Pending tasks */}
          {pending.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Tâches en cours ({pending.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {pending.map(task => {
                  const ps = PRIORITY_STYLES[task.priority ?? "medium"];
                  return (
                    <div key={task.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: ps.bg, color: ps.color }}>
                          {ps.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#F1F5F9", color: "#64748B" }}>
                          {COL_LABELS[task.column ?? "todo"]}
                        </span>
                        {selectedUid === "all" && (
                          <span className="text-xs text-muted-foreground">{getAgentName(task.assignee)}</span>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done tasks */}
          {done.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">Tâches terminées ({done.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {done.map(task => (
                  <div key={task.id} className="px-4 py-3 flex items-center gap-4 opacity-60">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate line-through">{task.title}</p>
                    </div>
                    {selectedUid === "all" && (
                      <span className="text-xs text-muted-foreground shrink-0">{getAgentName(task.assignee)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <ClipboardList size={32} className="opacity-30" />
              <p className="text-sm">Aucune tâche pour {selectedUid === "all" ? "l'équipe" : getAgentName(selectedUid)}</p>
            </div>
          )}
        </>
      )}

      {showAssign && (
        <AssignTaskModal
          agents={agents}
          saving={saving}
          onClose={() => setShowAssign(false)}
          onSave={handleAssign}
        />
      )}
    </div>
  );
}
