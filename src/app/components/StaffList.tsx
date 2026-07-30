import { useState, useEffect } from "react";
import { UserCog, Trash2, Edit2, X, Check, Loader2, Download, Search, UserPlus, Eye, EyeOff, FileText } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import jsPDF from "jspdf";
import { getAllStaff, updateUserRole, updateUserProfile, deleteUser, createStaffMember, type StaffMember } from "../../firebase/crud/users";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../hooks/useAuth";

const ROLE_LABELS: Record<UserRole, string> = {
  admin:   "Administrateur",
  manager: "Manager",
  agent:   "Commercial",
};

const ROLE_STYLES: Record<UserRole, { color: string; bg: string }> = {
  admin:   { color: "#EF4444", bg: "#FEE2E2" },
  manager: { color: "#8B5CF6", bg: "#EDE9FE" },
  agent:   { color: "#2563EB", bg: "#DBEAFE" },
};

interface EditModal {
  member: StaffMember;
  saving: boolean;
}

function StaffEditModal({ member, saving, onClose, onSave }: {
  member: StaffMember;
  saving: boolean;
  onClose: () => void;
  onSave: (uid: string, data: Partial<StaffMember>) => void;
}) {
  const { role: currentUserRole, user: currentUser } = useAuth();
  const [firstName, setFirstName] = useState(member.firstName ?? "");
  const [lastName,  setLastName]  = useState(member.lastName  ?? "");
  const [jobRole,   setJobRole]   = useState(member.jobRole   ?? "");
  const [role,      setRole]      = useState<UserRole>(member.role);

  const isSelf = currentUser?.uid === member.uid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">Modifier le membre</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prénom</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Poste</label>
            <input value={jobRole} onChange={e => setJobRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {currentUserRole === "admin" && !isSelf && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rôle</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="agent">Commercial</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
            Annuler
          </button>
          <button
            onClick={() => onSave(member.uid, { firstName, lastName, jobRole, role })}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffDetailModal({ member, onClose }: {
  member: StaffMember;
  onClose: () => void;
}) {
  const [stats, setStats] = useState({ contacts: 0, prospects: 0, tasksDone: 0, tasksOpen: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cSnap, pSnap, tSnap] = await Promise.all([
          getDocs(query(collection(db, "contacts"),  where("assignedTo", "==", member.uid))),
          getDocs(query(collection(db, "prospects"), where("assignedTo", "==", member.uid))),
          getDocs(query(collection(db, "tasks"),     where("assignee",   "==", member.uid))),
        ]);
        const tasks = tSnap.docs.map(d => d.data());
        setStats({
          contacts:  cSnap.size,
          prospects: pSnap.size,
          tasksDone: tasks.filter(t => t.column === "done").length,
          tasksOpen: tasks.filter(t => t.column !== "done").length,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [member.uid]);

  const name     = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
  const initials = name !== member.email
    ? name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : member.email[0].toUpperCase();
  const roleStyle = ROLE_STYLES[member.role];
  const roleLabel = ROLE_LABELS[member.role];

  const exportPDF = () => {
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 20; // margin

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, W, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(name, M, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Rapport de performance  ·  généré le ${today}`, M, 28);

    doc.setFontSize(8);
    doc.setTextColor(186, 210, 253);
    doc.text("CRM Arabsoft", M, 36);

    // ── Section helper ────────────────────────────────────────────────────────
    let y = 54;
    const sectionTitle = (title: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(title, M, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(M, y + 2, W - M, y + 2);
      y += 10;
    };

    // ── Informations ─────────────────────────────────────────────────────────
    sectionTitle("INFORMATIONS");

    const infoFields: [string, string][] = [
      ["Email",  member.email],
      ["Poste",  member.jobRole || "—"],
      ["Rôle",   roleLabel],
    ];

    const colW = (W - M * 2 - 6) / 2;
    infoFields.forEach(([label, value], i) => {
      const x = M + (i % 2) * (colW + 6);
      if (i % 2 === 0 && i > 0) y += 18;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, colW, 14, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(label.toUpperCase(), x + 4, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(value, x + 4, y + 11);
    });
    y += 26;

    // ── Statistiques ─────────────────────────────────────────────────────────
    sectionTitle("STATISTIQUES D'ACTIVITÉ");

    const statItems = [
      { label: "Clients assignés",   value: stats.contacts },
      { label: "Prospects assignés", value: stats.prospects },
      { label: "Tâches terminées",   value: stats.tasksDone },
      { label: "Tâches en cours",    value: stats.tasksOpen },
    ];
    const cardW = (W - M * 2 - 9) / 4;

    statItems.forEach((s, i) => {
      const x = M + i * (cardW + 3);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cardW, 26, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text(String(s.value), x + cardW / 2, y + 13, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(s.label, x + cardW / 2, y + 21, { align: "center" });
    });
    y += 36;

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.line(M, 280, W - M, 280);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("CRM Arabsoft · Rapport confidentiel", M, 285);
    doc.text(today, W - M, 285, { align: "right" });

    const filename = `rapport-${name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: "var(--primary)", color: "white" }}>{initials}</div>
            <div>
              <h2 className="text-foreground leading-tight">{name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{member.email}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-lg text-xs font-medium"
                style={{ background: roleStyle.bg, color: roleStyle.color }}>{roleLabel}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Info fields */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl" style={{ background: "var(--background)" }}>
            <p className="text-xs text-muted-foreground mb-1">Poste</p>
            <p className="text-sm font-medium text-foreground">{member.jobRole || "—"}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "var(--background)" }}>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium text-foreground truncate">{member.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activité</p>
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /><span className="text-sm">Chargement…</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Clients assignés",   value: stats.contacts },
                { label: "Prospects assignés", value: stats.prospects },
                { label: "Tâches terminées",   value: stats.tasksDone },
                { label: "Tâches en cours",    value: stats.tasksOpen },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: "var(--background)" }}>
                  <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
            Fermer
          </button>
          <button
            onClick={exportPDF}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            <FileText size={14} />
            Exporter PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (member: StaffMember) => void;
}) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [jobRole,   setJobRole]   = useState("");
  const [role,      setRole]      = useState<"agent" | "manager">("agent");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const handleCreate = async () => {
    setError("");
    if (!email.trim())        { setError("L'email est requis."); return; }
    if (password.length < 6)  { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    setSaving(true);
    try {
      const member = await createStaffMember(email.trim(), password, { firstName, lastName, jobRole, role });
      onCreated(member);
      onClose();
    } catch (e: any) {
      if (e?.code === "auth/email-already-in-use") {
        setError("Cette adresse email est déjà utilisée.");
      } else if (e?.code === "auth/invalid-email") {
        setError("Adresse email invalide.");
      } else {
        setError("Erreur lors de la création : " + (e?.message ?? e?.code ?? "inconnue"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-foreground">Ajouter un membre</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Créer un compte et lui assigner un rôle</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rôle</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["agent", "manager"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: role === r ? "var(--primary)" : "var(--border)",
                    background:  role === r ? "var(--accent)" : "transparent",
                    color:       role === r ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prénom</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Jean"
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Job title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Poste</label>
            <input value={jobRole} onChange={e => setJobRole(e.target.value)}
              placeholder="Ex : Responsable commercial"
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jean.dupont@exemple.com"
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mot de passe temporaire *</label>
            <div className="relative mt-1">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className="w-full px-3 pr-10 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Le membre pourra changer son mot de passe depuis son profil.</p>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#EF4444" }}>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {saving ? "Création…" : "Créer le compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaffList() {
  const { role: currentUserRole, user: currentUser } = useAuth();
  const [staff, setStaff]               = useState<StaffMember[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [editModal, setEditModal]       = useState<EditModal | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [detailMember, setDetailMember] = useState<StaffMember | null>(null);
  const [confirmMember, setConfirmMember] = useState<StaffMember | null>(null);

  const isAdmin   = currentUserRole === "admin";
  const isManager = currentUserRole === "manager";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAllStaff();
      setStaff(list);
    } catch (e: any) {
      console.error("getAllStaff error:", e);
      setError(e?.code === "permission-denied"
        ? "Permissions insuffisantes. Reconnectez-vous pour générer votre entrée dans la collection staff, puis rechargez la page."
        : `Erreur de chargement (${e?.code ?? "inconnue"}). Vérifiez votre connexion et rechargez.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (uid: string, data: Partial<StaffMember>) => {
    if (!editModal) return;
    setEditModal(m => m ? { ...m, saving: true } : null);
    await updateUserProfile(uid, data);
    if (data.role) await updateUserRole(uid, data.role);
    await load();
    setEditModal(null);
  };

  const handleDelete = async (uid: string) => {
    setConfirmMember(null);
    setDeleting(uid);
    try {
      await deleteUser(uid);
      setStaff(s => s.filter(m => m.uid !== uid));
    } catch (e: any) {
      console.error("deleteUser error:", e);
      setError(`Échec de la suppression (${e?.code ?? "inconnue"}). Réessayez.`);
    } finally {
      setDeleting(null);
    }
  };

  const exportPDF = () => {
    const lines = filtered.map(m => {
      const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
      return `${name} | ${ROLE_LABELS[m.role]} | ${m.jobRole ?? "—"} | ${m.email}`;
    });
    const content = "LISTE DU PERSONNEL\n\n" + lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "equipe.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = staff.filter(m => {
    const name = [m.firstName, m.lastName, m.email].join(" ").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 max-w-md text-center">
          <p className="text-sm font-medium text-red-700 mb-1">Impossible de charger l'équipe</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Chargement de l'équipe…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Équipe</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin ? "Gestion des membres — CRUD complet" : "Vue de l'équipe — lecture seule"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              <UserPlus size={14} />
              Ajouter un membre
            </button>
          )}
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download size={14} />
            Exporter
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un membre…"
          className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Stats by role */}
      <div className="grid grid-cols-3 gap-4">
        {(["admin", "manager", "agent"] as UserRole[]).map(r => {
          const count = staff.filter(m => m.role === r).length;
          const s = ROLE_STYLES[r];
          return (
            <div key={r} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <UserCog size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[r]}{count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Membre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poste</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rôle</th>
              {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-muted-foreground text-sm">
                  Aucun membre trouvé
                </td>
              </tr>
            ) : filtered.map(member => {
              const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "—";
              const initials = name !== "—"
                ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                : member.email[0].toUpperCase();
              const rs = ROLE_STYLES[member.role];
              const isSelf = member.uid === currentUser?.uid;

              const canViewDetail = isManager && member.role !== "admin";

              return (
                <tr
                  key={member.uid}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  style={{ cursor: canViewDetail ? "pointer" : "default" }}
                  onClick={canViewDetail ? () => setDetailMember(member) : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: "var(--primary)", color: "white" }}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        {isSelf && <p className="text-xs text-muted-foreground">Vous</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{member.jobRole ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: rs.bg, color: rs.color }}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditModal({ member, saving: false })}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => setConfirmMember(member)}
                            disabled={deleting === member.uid}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            {deleting === member.uid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editModal && (
        <StaffEditModal
          member={editModal.member}
          saving={editModal.saving}
          onClose={() => setEditModal(null)}
          onSave={handleSave}
        />
      )}

      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onCreated={(member) => setStaff(s => [...s, member])}
        />
      )}

      {detailMember && (
        <StaffDetailModal
          member={detailMember}
          onClose={() => setDetailMember(null)}
        />
      )}

      {confirmMember && (
        <ConfirmDeleteModal
          member={confirmMember}
          deleting={deleting === confirmMember.uid}
          onCancel={() => setConfirmMember(null)}
          onConfirm={() => handleDelete(confirmMember.uid)}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({ member, deleting, onCancel, onConfirm }: {
  member: StaffMember;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#FEE2E2", color: "#EF4444" }}>
            <Trash2 size={20} />
          </div>
          <div>
            <h2 className="text-foreground leading-tight">Supprimer ce membre ?</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Cette action est irréversible.</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Le compte de <span className="font-medium text-foreground">{name}</span> sera
          définitivement supprimé (authentification et données).
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#EF4444" }}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
