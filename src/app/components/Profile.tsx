import { useState } from "react";
import { User, Mail, Phone, Building, MapPin, Camera, Check, Bell, Shield, Globe, ChevronRight, Pencil, Sun, Moon, Monitor, X, Settings } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  language: string;
  timezone: string;
}

const initProfile: ProfileData = {
  firstName: "Hamza",
  lastName: "Necib",
  email: "hamza.necib@esprit.tn",
  phone: "+216 55 123 456",
  role: "Stagiaire",
  company: "Arabsoft",
  location: "Tunis, Tunisie",
  bio: "Stagiaire en développement commercial chez Arabsoft. Passionné par les solutions CRM et la relation client dans le marché tunisien.",
  language: "Français",
  timezone: "Africa/Tunis",
};

const notifSettings = [
  { id: "new_contact", label: "Nouveau contact ajouté", description: "Recevoir une notification quand un contact est créé" },
  { id: "task_due", label: "Tâche en retard", description: "Alertes pour les tâches dont l'échéance est dépassée" },
  { id: "meeting_reminder", label: "Rappel de réunion", description: "Notification 30 min avant chaque rendez-vous" },
  { id: "deal_update", label: "Mise à jour prospect", description: "Changements d'étape dans le pipeline" },
  { id: "weekly_report", label: "Rapport hebdomadaire", description: "Résumé de l'activité chaque lundi matin" },
];

function DisplayPreferencesModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: "light" as const, label: "Clair", description: "Interface lumineuse, idéale en journée", icon: Sun },
    { id: "dark" as const, label: "Sombre", description: "Interface sombre, réduit la fatigue visuelle", icon: Moon },
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
              <button
                key={id}
                onClick={() => setTheme(id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: isActive ? "var(--primary)" : "var(--border)",
                  background: isActive ? "var(--accent)" : "var(--background)",
                }}
              >
                {/* Theme preview thumbnail */}
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
  const [profile, setProfile] = useState<ProfileData>(initProfile);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileData>(initProfile);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({ new_contact: true, task_due: true, meeting_reminder: true, deal_update: false, weekly_report: true });
  const [saved, setSaved] = useState(false);
  const [showDisplayPrefs, setShowDisplayPrefs] = useState(false);
  const { theme } = useTheme();

  const handleSave = () => {
    setProfile(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const stats = [
    { label: "Contacts gérés", value: "347" },
    { label: "Deals conclus", value: "48" },
    { label: "CA généré", value: "1 529 K DT" },
    { label: "Tâches terminées", value: "216" },
  ];

  const quickLinks = [
    { icon: Shield, label: "Sécurité & mot de passe", action: () => {} },
    { icon: Globe, label: "Langue & région", action: () => {} },
    { icon: Monitor, label: "Préférences d'affichage", action: () => setShowDisplayPrefs(true) },
    { icon: Settings, label: "Paramètres avancés", action: () => onOpenSettings?.() },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground">Mon profil</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez vos informations personnelles et préférences</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme badge */}
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
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md" style={{ background: "var(--card)", border: "2px solid var(--border)" }}>
                <Camera size={12} className="text-muted-foreground" />
              </button>
            </div>
            <h2 className="text-foreground">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm text-muted-foreground">{profile.role}</p>
            <p className="text-xs text-muted-foreground mt-1">{profile.company}</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin size={11} />{profile.location}
            </div>
          </div>

          {/* Stats */}
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
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
                  style={isDisplayPrefs ? { background: "var(--accent)" } : {}}
                >
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
                <button onClick={() => { setForm(profile); setEditing(true); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors">
                  <Pencil size={13} /> Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors text-muted-foreground">Annuler</button>
                  <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: "var(--primary)" }}>
                    <Check size={13} /> Enregistrer
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Prénom", field: "firstName" as keyof ProfileData },
                  { label: "Nom", field: "lastName" as keyof ProfileData },
                  { label: "Email", field: "email" as keyof ProfileData },
                  { label: "Téléphone", field: "phone" as keyof ProfileData },
                  { label: "Poste", field: "role" as keyof ProfileData },
                  { label: "Entreprise", field: "company" as keyof ProfileData },
                  { label: "Localisation", field: "location" as keyof ProfileData },
                  { label: "Fuseau horaire", field: "timezone" as keyof ProfileData },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
                    <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Prénom", value: profile.firstName, icon: User },
                  { label: "Nom", value: profile.lastName, icon: User },
                  { label: "Email", value: profile.email, icon: Mail },
                  { label: "Téléphone", value: profile.phone, icon: Phone },
                  { label: "Poste", value: profile.role, icon: Building },
                  { label: "Entreprise", value: profile.company, icon: Building },
                  { label: "Localisation", value: profile.location, icon: MapPin },
                  { label: "Fuseau horaire", value: profile.timezone, icon: Globe },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: "var(--background)" }}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon size={12} className="text-muted-foreground shrink-0" />
                      {value}
                    </div>
                  </div>
                ))}
                <div className="col-span-2 p-3 rounded-xl" style={{ background: "var(--background)" }}>
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-foreground mb-5">Notifications</h3>
            <div className="space-y-4">
              {notifSettings.map(n => (
                <div key={n.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                  </div>
                  <button
                    onClick={() => setNotifs(ns => ({ ...ns, [n.id]: !ns[n.id] }))}
                    className="shrink-0 relative flex items-center px-0.5 rounded-full transition-all"
                    style={{ background: notifs[n.id] ? "var(--primary)" : "var(--muted)", height: "22px", width: "40px" }}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow transition-all" style={{ transform: notifs[n.id] ? "translateX(18px)" : "translateX(0px)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDisplayPrefs && <DisplayPreferencesModal onClose={() => setShowDisplayPrefs(false)} />}
    </div>
  );
}
