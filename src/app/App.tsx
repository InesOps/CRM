import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Tasks } from "./components/Tasks";
import { Contacts } from "./components/Contacts";
import { CalendarView } from "./components/CalendarView";
import { Prospects } from "./components/Prospects";
import { Profile } from "./components/Profile";
import { ThemeProvider } from "./components/ThemeContext";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsModal } from "./components/SettingsModal";
import { useAuth } from "../hooks/useAuth";   // ← ADD
import { logout } from "../firebase/auth";    // ← ADD

type Module = "dashboard" | "tasks" | "contacts" | "calendar" | "prospects" | "profile";

function CRMApp() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  const { user, role, loading } = useAuth();  // ← ADD
  console.log("App state:", { user: user?.email, role, loading }); // ← ADD

  // ← ADD: wait for Firebase to check auth state
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // ← ADD: not logged in → show login
  if (!user) return <LoginScreen />;

  // ✅ Remove the role checks for now
const renderModule = () => {
  switch (activeModule) {
    case "dashboard": return <Dashboard />;
    case "tasks":     return <Tasks />;
    case "contacts":  return <Contacts />;
    case "calendar":  return <CalendarView />;
    case "prospects": return <Prospects />;
    case "profile":   return <Profile onOpenSettings={() => setShowSettings(true)} />;
  }
};

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        activeModule={activeModule}
        onNavigate={setActiveModule}
        onLogout={logout}                                    // ← CHANGED: Firebase logout
        onOpenSettings={() => setShowSettings(true)}
        role={role}                                          // ← ADD: so Sidebar hides admin links for users
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