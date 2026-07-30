import { useState, useEffect } from "react";
import { Search, Plus, FolderKanban, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import {
  getProjects, addProject, updateProject, deleteProject,
} from "../../firebase/crud/projects";
import type { UserRole } from "../../hooks/useAuth";

export interface Project {
  id: string;
  projectId: number;
  name: string;
  description?: string;
}

interface ProjectsProps {
  role: UserRole | null;
}

function ProjectModal({
  project, saving, onClose, onSave,
}: {
  project: Partial<Project>;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
}) {
  const [name,        setName]        = useState(project.name        ?? "");
  const [description, setDescription] = useState(project.description ?? "");

  const canSave = name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">{project.id ? "Modifier le projet" : "Nouveau projet"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom du projet *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({ name: name.trim(), description: description.trim() })}
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

export function Projects({ role }: ProjectsProps) {
  const [projects,       setProjects]       = useState<Project[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [search,         setSearch]         = useState("");
  const [editingProject, setEditingProject] = useState<Partial<Project> | undefined>(undefined);
  const [deleteConfirm,  setDeleteConfirm]  = useState<Project | null>(null);

  const canManage = role === "admin" || role === "manager";

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getProjects();
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [role]);

  const handleSave = async (
    formData: { name: string; description: string },
    existing?: Partial<Project>
  ) => {
    setSaving(true);
    try {
      if (existing?.id) {
        await updateProject(existing.id, formData);
        setProjects(ps => ps.map(p => p.id === existing.id ? { ...p, ...formData } : p));
      } else {
        const ref = await addProject(formData);
        await load(); // reload to pick up the auto-incremented projectId
        void ref;
      }
      setEditingProject(undefined);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (project: Project) => {
    try {
      await deleteProject(project.id);
      setProjects(ps => ps.filter(p => p.id !== project.id));
    } catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const filtered = projects.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-foreground">Projets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.length} projets au total</p>
        </div>
        {canManage && (
          <button onClick={() => setEditingProject({})}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ background: "var(--primary)" }}>
            <Plus size={16} /> Nouveau projet
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-card rounded-2xl border border-border">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" /><span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "Nom", "Description", ...(canManage ? ["Actions"] : [])].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.projectId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "#EDE9FE", color: "#8B5CF6" }}>
                        <FolderKanban size={15} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.description || "—"}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingProject(p)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Edit2 size={13} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={13} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={canManage ? 4 : 3} className="px-4 py-12 text-center text-muted-foreground text-sm">Aucun projet trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingProject !== undefined && (
        <ProjectModal
          project={editingProject}
          saving={saving}
          onClose={() => setEditingProject(undefined)}
          onSave={(data) => handleSave(data, editingProject)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-foreground mb-2">Supprimer le projet</h2>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible. Les contacts et prospects rattachés ne seront pas supprimés, mais perdront ce projet.</p>
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
