import { useState, useEffect } from "react";
import { LayoutDashboard, CheckSquare, Users, Calendar, TrendingUp, User, ChevronRight, Building2, LogOut, Settings, AlertTriangle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";

type Module = "dashboard" | "tasks" | "contacts" | "calendar" | "prospects" | "profile";

interface SidebarProps {
  activeModule: Module;
  onNavigate: (module: Module) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

const navItems: { id: Module; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "tasks", label: "Tâches", icon: CheckSquare},
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  { id: "prospects", label: "Prospects", icon: TrendingUp},
  { id: "profile", label: "Mon profil", icon: User },
];

function LogoutConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FEE2E2" }}>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div>
            <h2 className="text-foreground">Déconnexion</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous serez redirigé vers la page de connexion.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#EF4444" }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ activeModule, onNavigate, onLogout, onOpenSettings }: SidebarProps) {
  const { user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jobRole, setJobRole] = useState("");

  // Fetch name + jobRole from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const first = data.firstName ?? "";
        const last  = data.lastName  ?? "";
        const full  = `${first} ${last}`.trim();
        setDisplayName(full || data.name || user.email || "");
        setJobRole(data.jobRole ?? "");
      } else {
        setDisplayName(user.email ?? "");
      }
    });
  }, [user]);

  // Build initials from name
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      <aside className="flex flex-col h-full w-60 shrink-0" style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Building2 size={16} color="white" />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#F8FAFC" }}>CRM Arabsoft</div>
            <div className="text-xs" style={{ color: "#475569" }}>Espace de travail</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#334155" }}>Navigation</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive ? "var(--sidebar-accent)" : "transparent",
                  color: isActive ? "#F1F5F9" : "var(--sidebar-foreground)",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={16} style={{ color: isActive ? "var(--primary)" : "#475569", flexShrink: 0 }} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: "var(--primary)", color: "white" }}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={12} style={{ color: "#475569" }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
          >
            <Settings size={15} />
            <span>Paramètres</span>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#FCA5A5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#475569"; }}
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>

          {/* User info — live from Firestore */}
          <div className="mt-3 flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: "var(--primary)", color: "white" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "#CBD5E1" }}>
                {displayName || "—"}
              </div>
              <div className="text-xs truncate" style={{ color: "#475569" }}>
                {jobRole || "—"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { setShowLogoutConfirm(false); onLogout(); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}