import { useState } from "react";
import { X, Bell, Shield, Monitor, Database, Clock, Check, ChevronRight, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface SettingsModalProps {
  onClose: () => void;
}

type Section = "general" | "notifications" | "security" | "data";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "Général", icon: Monitor },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "data", label: "Données & confidentialité", icon: Database },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="shrink-0 relative flex items-center px-0.5 rounded-full transition-all"
      style={{ background: value ? "var(--primary)" : "var(--muted)", height: "22px", width: "40px" }}
    >
      <span
        className="w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ transform: value ? "translateX(18px)" : "translateX(0px)" }}
      />
    </button>
  );
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [section, setSection] = useState<Section>("general");
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  // General settings
  const [density, setDensity] = useState<"compact" | "normal" | "comfortable">("normal");
  const [dateFormat, setDateFormat] = useState<"dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd">("dd/mm/yyyy");
  const [currency, setCurrency] = useState("DT");
  const [autoSave, setAutoSave] = useState(true);

  // Notification settings
  const [notifs, setNotifs] = useState({
    email: true,
    browser: true,
    newContact: true,
    taskDue: true,
    meetingReminder: true,
    dealUpdate: false,
    weeklyReport: true,
    soundEnabled: false,
  });

  // Security settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [showActivity, setShowActivity] = useState(true);

  // Data settings
  const [dataCollection, setDataCollection] = useState(true);
  const [crashReports, setCrashReports] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const renderSection = () => {
    switch (section) {
      case "general":
        return (
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Thème d'affichage</h4>
              <div className="flex gap-3">
                {([
                  { id: "light" as const, label: "Clair", icon: Sun },
                  { id: "dark" as const, label: "Sombre", icon: Moon },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: theme === id ? "var(--primary)" : "var(--border)",
                      background: theme === id ? "var(--accent)" : "var(--background)",
                      color: theme === id ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    <Icon size={15} /> {label}
                    {theme === id && <Check size={13} style={{ color: "var(--primary)" }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Densité d'affichage</h4>
              <div className="flex gap-2">
                {(["compact", "normal", "comfortable"] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className="flex-1 py-2 rounded-lg border text-sm capitalize transition-all"
                    style={{
                      borderColor: density === d ? "var(--primary)" : "var(--border)",
                      background: density === d ? "var(--accent)" : "var(--background)",
                      color: density === d ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {d === "compact" ? "Compact" : d === "normal" ? "Normal" : "Confortable"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date format */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Format de date</h4>
              <select
                value={dateFormat}
                onChange={e => setDateFormat(e.target.value as typeof dateFormat)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="dd/mm/yyyy">JJ/MM/AAAA (ex. 05/06/2026)</option>
                <option value="mm/dd/yyyy">MM/JJ/AAAA (ex. 06/05/2026)</option>
                <option value="yyyy-mm-dd">AAAA-MM-JJ (ex. 2026-06-05)</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Devise</h4>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="DT">Dinar Tunisien (DT)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar américain ($)</option>
              </select>
            </div>

            {/* Auto save */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Sauvegarde automatique</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enregistrer automatiquement les modifications</p>
              </div>
              <Toggle value={autoSave} onChange={setAutoSave} />
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Canaux de notification</h4>
              <div className="space-y-3">
                {[
                  { key: "email" as const, label: "Notifications par email", desc: "Recevoir les alertes par email" },
                  { key: "browser" as const, label: "Notifications navigateur", desc: "Afficher des notifications dans le navigateur" },
                  { key: "soundEnabled" as const, label: "Sons de notification", desc: "Jouer un son lors des alertes" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Toggle value={notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Événements</h4>
              <div className="space-y-3">
                {[
                  { key: "newContact" as const, label: "Nouveau contact", desc: "Quand un contact est créé" },
                  { key: "taskDue" as const, label: "Tâche en retard", desc: "Quand une échéance est dépassée" },
                  { key: "meetingReminder" as const, label: "Rappel de réunion", desc: "30 min avant chaque RDV" },
                  { key: "dealUpdate" as const, label: "Mise à jour prospect", desc: "Changement d'étape dans le pipeline" },
                  { key: "weeklyReport" as const, label: "Rapport hebdomadaire", desc: "Résumé chaque lundi matin" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Toggle value={notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Authentification</h4>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Authentification à deux facteurs</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sécuriser la connexion avec un code OTP</p>
                </div>
                <Toggle value={twoFactor} onChange={setTwoFactor} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Journal d'activité</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Conserver l'historique des connexions</p>
                </div>
                <Toggle value={showActivity} onChange={setShowActivity} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Session</h4>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiration de session</label>
                <select
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="240">4 heures</option>
                  <option value="0">Jamais</option>
                </select>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border" style={{ background: "var(--background)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Changer le mot de passe</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Dernière modification : jamais</p>
                </div>
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
                  Modifier <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Confidentialité</h4>
              <div className="space-y-0">
                {[
                  { label: "Collecte de données d'utilisation", desc: "Aide à améliorer l'application", value: dataCollection, onChange: setDataCollection },
                  { label: "Rapports d'erreurs automatiques", desc: "Envoyer les erreurs pour diagnostic", value: crashReports, onChange: setCrashReports },
                ].map(({ label, desc, value, onChange }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Toggle value={value} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Gestion des données</h4>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm">
                <span className="text-foreground">Exporter mes données (CSV)</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors hover:bg-red-50"
                style={{ borderColor: "#FCA5A5" }}>
                <span style={{ color: "#EF4444" }}>Supprimer mon compte</span>
                <ChevronRight size={14} style={{ color: "#EF4444" }} />
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex overflow-hidden" style={{ maxHeight: "85vh" }}>
        {/* Left nav */}
        <div className="w-48 shrink-0 border-r border-border flex flex-col py-5 px-3" style={{ background: "var(--background)" }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">Paramètres</p>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left"
                style={{
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-foreground">{SECTIONS.find(s => s.id === section)?.label}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {renderSection()}
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            {saved ? (
              <span className="flex items-center gap-2 text-sm" style={{ color: "#10B981" }}>
                <Check size={14} /> Paramètres enregistrés
              </span>
            ) : <span />}
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ background: "var(--primary)" }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
