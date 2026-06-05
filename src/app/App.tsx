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

type Module = "dashboard" | "tasks" | "contacts" | "calendar" | "prospects" | "profile";

function CRMApp() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <Dashboard />;
      case "tasks": return <Tasks />;
      case "contacts": return <Contacts />;
      case "calendar": return <CalendarView />;
      case "prospects": return <Prospects />;
      case "profile": return <Profile onOpenSettings={() => setShowSettings(true)} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        activeModule={activeModule}
        onNavigate={setActiveModule}
        onLogout={() => setIsLoggedIn(false)}
        onOpenSettings={() => setShowSettings(true)}
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
