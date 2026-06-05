import { useState } from "react";
import { Eye, EyeOff, Building2, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle, User, UserPlus } from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

type View = "login" | "forgot" | "register";

export function LoginScreen() {
  const [view, setView] = useState<View>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Email ou mot de passe incorrect.");
          break;
        case "auth/too-many-requests":
          setError("Trop de tentatives. Réessayez plus tard.");
          break;
        default:
          setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) { setForgotError("Veuillez saisir votre adresse email."); return; }
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
    } catch (err: any) {
      setForgotError("Aucun compte associé à cet email.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) { setRegError("Veuillez saisir votre nom complet."); return; }
    if (!regEmail.trim()) { setRegError("Veuillez saisir votre adresse email."); return; }
    if (regPassword.length < 6) { setRegError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (regPassword !== regConfirm) { setRegError("Les mots de passe ne correspondent pas."); return; }

    setRegLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const uid = credential.user.uid;

      // 2. Create user document in Firestore with role 'user' by default
      await setDoc(doc(db, "users", uid), {
        name: regName.trim(),
        email: regEmail.trim(),
        role: "user",           // ← default role, admin can change this in Firestore
        createdAt: Timestamp.now(),
      });

      await signOut(auth); // ← ADD THIS — empêche la connexion automatique

      setRegSuccess(true);
    } catch (err: any) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setRegError("Un compte existe déjà avec cet email.");
          break;
        case "auth/invalid-email":
          setRegError("Adresse email invalide.");
          break;
        case "auth/weak-password":
          setRegError("Mot de passe trop faible.");
          break;
        default:
          setRegError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setRegLoading(false);
    }
  };

  // ─── FORGOT PASSWORD VIEW ───────────────────────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Building2 size={20} color="white" />
            </div>
            <span className="text-xl font-semibold text-foreground">CRM Arabsoft</span>
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

  // ─── REGISTER VIEW ──────────────────────────────────────────────────────────
  if (view === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Building2 size={20} color="white" />
            </div>
            <span className="text-xl font-semibold text-foreground">CRM Arabsoft</span>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {regSuccess ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
                  <CheckCircle size={28} color="#10B981" />
                </div>
                <h2 className="text-foreground mb-2">Compte créé !</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
                </p>
                <button
                  onClick={() => { setView("login"); setRegSuccess(false); setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm(""); }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)" }}
                >
                  Se connecter
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
                <h2 className="text-foreground mb-1">Créer un compte</h2>
                <p className="text-sm text-muted-foreground mb-6">Remplissez les informations pour créer votre espace.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom complet</label>
                    <div className="relative mt-1">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={regName}
                        onChange={e => { setRegName(e.target.value); setRegError(""); }}
                        placeholder="Prénom Nom"
                        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                    <div className="relative mt-1">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => { setRegEmail(e.target.value); setRegError(""); }}
                        placeholder="votre@email.tn"
                        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mot de passe</label>
                    <div className="relative mt-1">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={e => { setRegPassword(e.target.value); setRegError(""); }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirmer le mot de passe</label>
                    <div className="relative mt-1">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regConfirm}
                        onChange={e => { setRegConfirm(e.target.value); setRegError(""); }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        style={{ borderColor: regConfirm && regConfirm !== regPassword ? "#EF4444" : "var(--border)" }}
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {regError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                      <AlertCircle size={14} /> {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--primary)" }}
                  >
                    {regLoading ? "Création en cours…" : "Créer mon compte"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            CRM PFE 2025-2026 — Arabsoft © 2026
          </p>
        </div>
      </div>
    );
  }

  // ─── LOGIN VIEW (default) ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Building2 size={20} color="white" />
          </div>
          <span className="text-xl font-semibold text-foreground">CRM Arabsoft</span>
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register button */}
          <button
            onClick={() => setView("register")}
            className="w-full py-2.5 rounded-xl text-sm font-medium border border-border transition-all hover:bg-muted flex items-center justify-center gap-2 text-foreground"
          >
            <UserPlus size={15} />
            Créer un compte
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CRM PFE 2025-2026 — Arabsoft © 2026
        </p>
      </div>
    </div>
  );
}