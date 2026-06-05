import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, MapPin, Camera, Check, Shield, Globe, ChevronRight, Pencil, Sun, Moon, Monitor, X, Settings, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  timezone: string;
}

const emptyProfile: ProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  company: "",
  location: "",
  bio: "",
  timezone: "Africa/Tunis",
};

const notifSettingsList = [
  { id: "new_contact",      label: "Nouveau contact ajouté",  description: "Recevoir une notification quand un contact est créé" },
  { id: "task_due",         label: "Tâche en retard",         description: "Alertes pour les tâches dont l'échéance est dépassée" },
  { id: "meeting_reminder", label: "Rappel de réunion",       description: "Notification 30 min avant chaque rendez-vous" },
  { id: "deal_update",      label: "Mise à jour prospect",    description: "Changements d'étape dans le pipeline" },
  { id: "weekly_report",    label: "Rapport hebdomadaire",    description: "Résumé de l'activité chaque lundi matin" },
];

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState(false);
  const [loading,         setLoading]         = useState(false);

  const handleChange = async () => {
    setError("");
    if (!currentPassword) { setError("Veuillez saisir votre mot de passe actuel."); return; }
    if (newPassword.length < 6) { setError("Le nouveau mot de passe doit contenir au moins 6 caractères."); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Utilisateur non connecté");
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Mot de passe actuel incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("Mot de passe trop faible.");
      } else {
        setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-foreground">Changer le mot de passe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Mis à jour dans la base de données</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
              <Check size={28} color="#10B981" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Mot de passe modifié !</p>
            <p className="text-xs text-muted-foreground mb-5">Votre mot de passe a été mis à jour avec succès.</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "var(--primary)" }}>
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mot de passe actuel</label>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* New password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nouveau mot de passe</label>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* Confirm password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirmer le mot de passe</label>
              <div className="relative mt-1">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ borderColor: confirmPassword && confirmPassword !== newPassword ? "#EF4444" : "var(--border)" }}
                />
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">
                Annuler
              </button>
              <button
                onClick={handleChange}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "var(--primary)" }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {loading ? "Modification…" : "Modifier"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Display Preferences Modal ─────────────────────────────────────────────────
function DisplayPreferencesModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light" as const, label: "Clair",  description: "Interface lumineuse, idéale en journée",        icon: Sun  },
    { id: "dark"  as const, label: "Sombre", description: "Interface sombre, réduit la fatigue visuelle",  icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-foreground">Préférences d'affichage</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choisissez votre thème</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-3">
          {options.map(({ id, label, description, icon: Icon }) => {
            const isActive = theme === id;
            return (
              <button key={id} onClick={() => setTheme(id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                style={{ borderColor: isActive ? "var(--primary)" : "var(--border)", background: isActive ? "var(--accent)" : "var(--background)" }}>
                <div className="w-12 h-9 rounded-lg shrink-0 overflow-hidden border border-border flex flex-col"
                  style={{ background: id === "dark" ? "#0F172A" : "#F8FAFC" }}>
                  <div className="flex-none h-2.5 px-1.5 flex items-center gap-1" style={{ background: id === "dark" ? "#1E293B" : "#E2E8F0" }}>
                    <div className="w-1 h-1 rounded-full" style={{ background: id === "dark" ? "#475569" : "#94A3B8" }} />
                    <div className="flex-1 h-0.5 rounded-full" style={{ background: id === "dark" ? "#334155" : "#CBD5E1" }} />
                  </div>
                  <div className="flex flex-1 gap-1 p-1">
                    <div className="w-3 rounded-sm" style={{ background: id === "dark" ? "#1E293B" : "#E2E8F0" }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1 rounded-full" style={{ background: id === "dark" ? "#334155" : "#CBD5E1" }} />
                      <div className="h-1 rounded-full w-3/4" style={{ background: id === "dark" ? "#1E293B" : "#E2E8F0" }} />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }} />
                    <span className="text-sm font-semibold" style={{ color: isActive ? "var(--primary)" : "var(--foreground)" }}>{label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: isActive ? "var(--primary)" : "var(--border)", background: isActive ? "var(--primary)" : "transparent" }}>
                  {isActive && <Check size={11} color="white" />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Le thème est enregistré automatiquement et persistera entre les sessions.
        </p>
      </div>
    </div>
  );
}

interface ProfileProps {
  onOpenSettings?: () => void;
}

export function Profile({ onOpenSettings }: ProfileProps) {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [profile,         setProfile]         = useState<ProfileData>(emptyProfile);
  const [form,            setForm]            = useState<ProfileData>(emptyProfile);
  const [editing,         setEditing]         = useState(false);
  const [notifs,          setNotifs]          = useState<Record<string, boolean>>({
    new_contact: true, task_due: true, meeting_reminder: true, deal_update: false, weekly_report: true,
  });
  const [saved,           setSaved]           = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [loadingProfile,  setLoadingProfile]  = useState(true);
  const [showDisplayPrefs, setShowDisplayPrefs] = useState(false);
  const [showChangePass,  setShowChangePass]  = useState(false);

  // Live stats from Firestore
  const [liveStats, setLiveStats] = useState({
    contactsManaged: 0,
    dealsWon:        0,
    caGenere:        0,
    tasksDone:       0,
  });

  // ── Load profile from Firestore ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingProfile(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const loaded: ProfileData = {
            firstName: data.firstName ?? data.name?.split(" ")[0] ?? "",
            lastName:  data.lastName  ?? data.name?.split(" ").slice(1).join(" ") ?? "",
            email:     data.email     ?? user.email ?? "",
            phone:     data.phone     ?? "",
            role:      data.jobRole   ?? "",
            company:   data.company   ?? "",
            location:  data.location  ?? "",
            bio:       data.bio       ?? "",
            timezone:  data.timezone  ?? "Africa/Tunis",
          };
          setProfile(loaded);
          setForm(loaded);
          if (data.notifications) setNotifs(data.notifications);
        }
      } catch (err) { console.error(err); }
      finally { setLoadingProfile(false); }
    })();
  }, [user]);

  // ── Load live stats from Firestore ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [contactsSnap, prospectsSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, "contacts")),
          getDocs(collection(db, "prospects")),
          getDocs(collection(db, "tasks")),
        ]);

        const contacts  = contactsSnap.docs.map(d => d.data());
        const prospects = prospectsSnap.docs.map(d => d.data());
        const tasks     = tasksSnap.docs.map(d => d.data());

        const contactsManaged = contacts.length;
        const dealsWon        = prospects.filter(p => p.stage === "gagne").length;
        const caGenere        = contacts.reduce((s, c) => s + (Number(c.DealValue) || 0), 0);
        const tasksDone       = tasks.filter(t => t.column === "done").length;

        setLiveStats({ contactsManaged, dealsWon, caGenere, tasksDone });
      } catch (err) { console.error(err); }
    })();
  }, []);

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // updateDoc only — never setDoc, so we never overwrite the existing document
      await updateDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        phone:     form.phone,
        jobRole:   form.role,
        company:   form.company,
        location:  form.location,
        bio:       form.bio,
        timezone:  form.timezone,
        updatedAt: Timestamp.now(),
      });
      setProfile(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  // ── Notification toggle ───────────────────────────────────────────────────
  const handleNotifToggle = async (id: string) => {
    if (!user) return;
    const updated = { ...notifs, [id]: !notifs[id] };
    setNotifs(updated);
    try { await updateDoc(doc(db, "users", user.uid), { notifications: updated }); }
    catch (err) { console.error(err); }
  };

  const stats = [
    { label: "Contacts gérés",   value: liveStats.contactsManaged.toString() },
    { label: "Deals conclus",    value: liveStats.dealsWon.toString() },
    { label: "CA généré",        value: `${liveStats.caGenere.toLocaleString("fr-FR")} DT` },
    { label: "Tâches terminées", value: liveStats.tasksDone.toString() },
  ];

  const quickLinks = [
    { icon: Shield,  label: "Sécurité & mot de passe",  action: () => setShowChangePass(true) },
    { icon: Monitor, label: "Préférences d'affichage",  action: () => setShowDisplayPrefs(true) },
    { icon: Settings,label: "Paramètres avancés",       action: () => onOpenSettings?.() },
  ];

  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  if (loadingProfile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Chargement du profil…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground">Mon profil</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez vos informations personnelles et préférences</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground">
            {theme === "dark" ? <Moon size={13} /> : <Sun size={13} />}
            Thème {theme === "dark" ? "sombre" : "clair"}
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "#D1FAE5", color: "#10B981" }}>
              <Check size={14} /> Profil enregistré
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Avatar card */}
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold" style={{ background: "var(--primary)", color: "white" }}>
                {initials}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md" style={{ background: "var(--card)", border: "2px solid var(--border)" }}>
                <Camera size={12} className="text-muted-foreground" />
              </button>
            </div>
            <h2 className="text-foreground">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm text-muted-foreground">{profile.role || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">{profile.company || "—"}</p>
            {profile.location && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin size={11} />{profile.location}
              </div>
            )}
          </div>

          {/* Stats — live from Firestore */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-foreground mb-4">Statistiques</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: "var(--background)" }}>
                  <p className="text-lg font-semibold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-foreground mb-3">Accès rapide</h3>
            {quickLinks.map(item => {
              const Icon = item.icon;
              const isDisplayPrefs = item.label === "Préférences d'affichage";
              return (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
                  style={isDisplayPrefs ? { background: "var(--accent)" } : {}}>
                  <span className="flex items-center gap-3">
                    <Icon size={14} style={{ color: isDisplayPrefs ? "var(--primary)" : "var(--muted-foreground)" }} />
                    <span className="text-foreground">{item.label}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {isDisplayPrefs && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "white" }}>
                        {theme === "dark" ? "Sombre" : "Clair"}
                      </span>
                    )}
                    <ChevronRight size={13} className="text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right columns */}
        <div className="col-span-2 space-y-5">
          {/* Personal info */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-foreground">Informations personnelles</h3>
              {!editing ? (
                <button onClick={() => { setForm(profile); setEditing(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors">
                  <Pencil size={13} /> Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors text-muted-foreground">
                    Annuler
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white disabled:opacity-60"
                    style={{ background: "var(--primary)" }}>
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {saving ? "Sauvegarde…" : "Enregistrer"}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                {([
                  { label: "Prénom",         field: "firstName" },
                  { label: "Nom",            field: "lastName"  },
                  { label: "Email",          field: "email"     },
                  { label: "Téléphone",      field: "phone"     },
                  { label: "Poste",          field: "role"      },
                  { label: "Entreprise",     field: "company"   },
                  { label: "Localisation",   field: "location"  },
                  { label: "Fuseau horaire", field: "timezone"  },
                ] as { label: string; field: keyof ProfileData }[]).map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
                    <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {([
                  { label: "Prénom",         value: profile.firstName, icon: User     },
                  { label: "Nom",            value: profile.lastName,  icon: User     },
                  { label: "Email",          value: profile.email,     icon: Mail     },
                  { label: "Téléphone",      value: profile.phone,     icon: Phone    },
                  { label: "Poste",          value: profile.role,      icon: Building },
                  { label: "Entreprise",     value: profile.company,   icon: Building },
                  { label: "Localisation",   value: profile.location,  icon: MapPin   },
                  { label: "Fuseau horaire", value: profile.timezone,  icon: Globe    },
                ] as { label: string; value: string; icon: any }[]).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: "var(--background)" }}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon size={12} className="text-muted-foreground shrink-0" />
                      {value || <span className="text-muted-foreground italic font-normal">Non renseigné</span>}
                    </div>
                  </div>
                ))}
                <div className="col-span-2 p-3 rounded-xl" style={{ background: "var(--background)" }}>
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {profile.bio || <span className="text-muted-foreground italic">Non renseigné</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-foreground mb-5">Notifications</h3>
            <div className="space-y-4">
              {notifSettingsList.map(n => (
                <div key={n.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                  </div>
                  <button onClick={() => handleNotifToggle(n.id)}
                    className="shrink-0 relative flex items-center px-0.5 rounded-full transition-all"
                    style={{ background: notifs[n.id] ? "var(--primary)" : "var(--muted)", height: "22px", width: "40px" }}>
                    <span className="w-4 h-4 rounded-full bg-white shadow transition-all"
                      style={{ transform: notifs[n.id] ? "translateX(18px)" : "translateX(0px)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDisplayPrefs && <DisplayPreferencesModal onClose={() => setShowDisplayPrefs(false)} />}
      {showChangePass   && <ChangePasswordModal     onClose={() => setShowChangePass(false)} />}
    </div>
  );
}