import { useState } from "react";
import { Eye, EyeOff, Building2, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";

const CREDENTIALS = {
  email: "hamza.necib@esprit.tn",
  password: "hamza123",
};

interface LoginScreenProps {
  onLogin: () => void;
}

type View = "login" | "forgot";

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (email === CREDENTIALS.email && password === CREDENTIALS.password) {
        onLogin();
      } else {
        setError("Email ou mot de passe incorrect.");
      }
      setLoading(false);
    }, 600);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) { setForgotError("Veuillez saisir votre adresse email."); return; }
    if (forgotEmail !== CREDENTIALS.email) {
      setForgotError("Aucun compte associé à cet email.");
      return;
    }
    setForgotSent(true);
  };

  if (view === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Building2 size={20} color="white" />
            </div>
            <span className="text-xl font-semibold text-foreground">CRM Pro</span>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {forgotSent ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
                  <CheckCircle size={28} color="#10B981" />
                </div>
                <h2 className="text-foreground mb-2">Email envoyé</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Un lien de réinitialisation a été envoyé à <strong>{forgotEmail}</strong>. Vérifiez votre boîte mail.
                </p>
                <button
                  onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)" }}
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setView("login")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
                >
                  <ArrowLeft size={14} /> Retour
                </button>
                <h2 className="text-foreground mb-1">Mot de passe oublié</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Entrez votre email et nous vous enverrons un lien de réinitialisation.
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresse email</label>
                    <div className="relative mt-1">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="votre@email.tn"
                        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                      <AlertCircle size={14} /> {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--primary)" }}
                  >
                    Envoyer le lien
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Building2 size={20} color="white" />
          </div>
          <span className="text-xl font-semibold text-foreground">CRM Pro</span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-foreground mb-1">Connexion</h2>
          <p className="text-sm text-muted-foreground mb-6">Bienvenue — connectez-vous à votre espace.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
              <div className="relative mt-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="votre@email.tn"
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                  style={{ borderColor: error ? "#EF4444" : "var(--border)" }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mot de passe</label>
              <div className="relative mt-1">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                  style={{ borderColor: error ? "#EF4444" : "var(--border)" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-xs hover:underline transition-colors"
                style={{ color: "var(--primary)" }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CRM Pro Tunisie — Arabsoft © 2026
        </p>
      </div>
    </div>
  );
}
