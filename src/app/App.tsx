import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Tasks } from "./components/Tasks";
import { Contacts } from "./components/Contacts";
import { CalendarView } from "./components/CalendarView";
import { Prospects } from "./components/Prospects";
import { Projects } from "./components/Projects";
import { Profile } from "./components/Profile";
import { ThemeProvider } from "./components/ThemeContext";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsModal } from "./components/SettingsModal";
import { StaffList } from "./components/StaffList";
import { GlobalTasks } from "./components/GlobalTasks";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../firebase/auth";
import type { UserRole } from "../hooks/useAuth";

export type Module =
  | "dashboard"
  | "tasks"
  | "contacts"
  | "calendar"
  | "prospects"
  | "projects"
  | "profile"
  | "staff"
  | "global-tasks";

function getDefaultModule(role: UserRole | null): Module {
  return "dashboard";
}

function isModuleAllowed(module: Module, role: UserRole | null): boolean {
  if (!role) return false;
  const allowed: Record<UserRole, Module[]> = {
    admin:   ["dashboard", "contacts", "prospects", "projects", "calendar", "tasks", "staff", "global-tasks", "profile"],
    manager: ["dashboard", "contacts", "prospects", "projects", "calendar", "tasks", "global-tasks", "staff", "profile"],
    agent:   ["dashboard", "contacts", "prospects", "calendar", "tasks", "profile"],
  };
  return allowed[role]?.includes(module) ?? false;
}

function CRMApp() {
  const { user, role, loading } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [showSettings, setShowSettings] = useState(false);

  if (loading) return <div className="flex h-screen items-center justify-center">Chargement…</div>;
  if (!user) return <LoginScreen />;

  const navigate = (module: Module) => {
    if (isModuleAllowed(module, role)) setActiveModule(module);
  };

  const renderModule = () => {
    if (!isModuleAllowed(activeModule, role)) return <Dashboard role={role} />;
    switch (activeModule) {
      case "dashboard":    return <Dashboard role={role} />;
      case "tasks":        return <Tasks />;
      case "contacts":     return <Contacts role={role} userId={user.uid} />;
      case "calendar":     return <CalendarView role={role} userId={user.uid} />;
      case "prospects":    return <Prospects role={role} userId={user.uid} />;
      case "projects":     return <Projects role={role} />;
      case "profile":      return <Profile onOpenSettings={() => setShowSettings(true)} />;
      case "staff":        return <StaffList />;
      case "global-tasks": return <GlobalTasks />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        activeModule={activeModule}
        onNavigate={navigate}
        onLogout={logout}
        onOpenSettings={() => setShowSettings(true)}
        role={role}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {renderModule()}
      </main>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CRMApp />
    </ThemeProvider>
  );
}
