import { useState, useEffect } from "react";
import { X, Bell, Shield, Monitor, Database, Check, ChevronRight, Sun, Moon, Loader2, AlertTriangle } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { logout } from "../../firebase/auth";

interface SettingsModalProps {
  onClose: () => void;
}

type Section = "general" | "notifications" | "security" | "data";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "Général",                icon: Monitor  },
  { id: "notifications", label: "Notifications",          icon: Bell     },
  { id: "security",      label: "Sécurité",               icon: Shield   },
  { id: "data",          label: "Données & confidentialité", icon: Database },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="shrink-0 relative flex items-center px-0.5 rounded-full transition-all"
      style={{ background: value ? "var(--primary)" : "var(--muted)", height: "22px", width: "40px" }}>
      <span className="w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ transform: value ? "translateX(18px)" : "translateX(0px)" }} />
    </button>
  );
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [section, setSection] = useState<Section>("general");
  const { theme, setTheme }   = useTheme();
  const { user }              = useAuth();
  const [saved,    setSaved]  = useState(false);
  const [saving,   setSaving] = useState(false);

  // General
  const [density,    setDensity]    = useState<"compact"|"normal"|"comfortable">("normal");
  const [dateFormat, setDateFormat] = useState<"dd/mm/yyyy"|"mm/dd/yyyy"|"yyyy-mm-dd">("dd/mm/yyyy");
  const [currency,   setCurrency]   = useState("DT");
  const [autoSave,   setAutoSave]   = useState(true);
  const [rate,       setRate]       = useState<number | null>(null);
  const [rateLoading,setRateLoading]= useState(false);

  // Notifications — synced with Firestore
  const [notifs, setNotifs] = useState({
    email:           true,
    browser:         true,
    soundEnabled:    false,
    newContact:      true,
    taskDue:         true,
    meetingReminder: true,
    dealUpdate:      false,
    weeklyReport:    true,
  });
  const [notifsLoading, setNotifsLoading] = useState(true);

  // Security
  const [showActivity,    setShowActivity]    = useState(true);
  const [sessionTimeout,  setSessionTimeout]  = useState("30");

  // Data
  const [dataCollection, setDataCollection] = useState(true);
  const [crashReports,   setCrashReports]   = useState(true);
  const [exporting,      setExporting]      = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword,    setDeletePassword]    = useState("");
  const [deleteError,       setDeleteError]       = useState("");
  const [deleting,          setDeleting]          = useState(false);

  // ── Load notifications from Firestore ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      setNotifsLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().notifications) {
          setNotifs(n => ({ ...n, ...snap.data().notifications }));
        }
      } catch (e) { console.error(e); }
      finally { setNotifsLoading(false); }
    })();
  }, [user]);

  // ── Fetch live exchange rate when currency changes ─────────────────────────
  useEffect(() => {
    if (currency === "DT") { setRate(null); return; }
    setRateLoading(true);
    const target = currency === "EUR" ? "EUR" : "USD";
    fetch(`https://api.frankfurter.app/latest?from=TND&to=${target}`)
      .then(r => r.json())
      .then(data => setRate(data.rates?.[target] ?? null))
      .catch(() => setRate(null))
      .finally(() => setRateLoading(false));
  }, [currency]);

  // ── Save notification to Firestore immediately on toggle ───────────────────
  const handleNotifToggle = async (key: keyof typeof notifs) => {
    if (!user) return;
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    try {
      await updateDoc(doc(db, "users", user.uid), { notifications: updated });
    } catch (e) { console.error(e); }
  };

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [userSnap, contactsSnap, prospectsSnap, tasksSnap, calendarSnap] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDocs(collection(db, "contacts")),
        getDocs(collection(db, "prospects")),
        getDocs(collection(db, "tasks")),
        getDocs(collection(db, "calendar")),
      ]);

      const userData    = userSnap.data() ?? {};
      const contacts    = contactsSnap.docs.map(d => d.data());
      const prospects   = prospectsSnap.docs.map(d => d.data());
      const tasks       = tasksSnap.docs.map(d => d.data());
      const meetings    = calendarSnap.docs.map(d => d.data());
      const totalCA     = contacts.reduce((s, c) => s + (Number(c.DealValue) || 0), 0);
      const dealsWon    = prospects.filter(p => p.stage === "gagne").length;
      const tasksDone   = tasks.filter(t => t.column === "done").length;
      const today       = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      // ── Commercial: clients assigned to this user + revenue brought per month ─
      const MONTHS_FR  = ["Jan","Fév","Mar","Avr","Mai","Jun","Juil","Aoû","Sep","Oct","Nov","Déc"];
      const myContacts = contacts.filter(c => (c as any).assignedTo === user.uid);
      const myCA       = myContacts.reduce((s, c) => s + (Number(c.DealValue) || 0), 0);

      // Revenue brought per month — grouped by the client's last-contact month
      const monthTotals: Record<number, number> = {};
      myContacts.forEach(c => {
        const deal = Number(c.DealValue) || 0;
        if (!deal) return;
        const lc = (c as any).lastContact;
        if (!lc) return;
        let m: number;
        if (lc?.toDate) { m = lc.toDate().getMonth(); }
        else { const d = new Date(`${lc}T12:00`); if (isNaN(d.getTime())) return; m = d.getMonth(); }
        monthTotals[m] = (monthTotals[m] || 0) + deal;
      });
      const monthly  = Array.from({ length: 12 }, (_, i) => ({ month: MONTHS_FR[i], value: monthTotals[i] || 0 }));
      const chartMax = Math.max(...monthly.map(m => m.value), 1);

      // Inline SVG bar chart (self-contained, prints reliably)
      const barW = 34, gap = 12, chartH = 150, baseY = 172, leftPad = 30;
      const chartW = leftPad + monthly.length * (barW + gap);
      const bars = monthly.map((m, i) => {
        const h = Math.round((m.value / chartMax) * chartH);
        const x = leftPad + i * (barW + gap);
        const y = baseY - h;
        const kLabel = m.value >= 1000 ? `${Math.round(m.value / 1000)}k` : `${Math.round(m.value)}`;
        return `
          <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="#2563eb"></rect>
          <text x="${x + barW / 2}" y="${baseY + 14}" font-size="10" text-anchor="middle" fill="#64748b">${m.month}</text>
          ${m.value > 0 ? `<text x="${x + barW / 2}" y="${y - 4}" font-size="9" text-anchor="middle" fill="#1e293b">${kLabel}</text>` : ""}`;
      }).join("");
      const chartSvg = `
        <svg width="${chartW}" height="${baseY + 22}" viewBox="0 0 ${chartW} ${baseY + 22}" style="max-width:100%">
          <line x1="${leftPad}" y1="${baseY}" x2="${chartW}" y2="${baseY}" stroke="#e2e8f0" stroke-width="1"></line>
          ${bars}
        </svg>`;

      // Build HTML for the PDF
      const html = `
        <html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 13px; }
          h1 { font-size: 22px; color: #2563eb; margin-bottom: 4px; }
          h2 { font-size: 15px; color: #2563eb; margin: 28px 0 10px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
          .kpis { display: flex; gap: 16px; margin-bottom: 8px; }
          .kpi { background: #f1f5f9; border-radius: 10px; padding: 14px 20px; flex: 1; }
          .kpi-val { font-size: 20px; font-weight: 700; color: #1e293b; }
          .kpi-lbl { font-size: 11px; color: #64748b; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: .5px; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .footer { margin-top: 40px; color: #94a3b8; font-size: 11px; text-align: center; }
        </style></head><body>
        <h1>Rapport CRM — ${userData.firstName ?? ""} ${userData.lastName ?? ""}</h1>
        <div class="meta">Généré le ${today} · ${userData.email ?? user.email}</div>

        <h2>Vue d'ensemble</h2>
        <div class="kpis">
          <div class="kpi"><div class="kpi-val">${contacts.length}</div><div class="kpi-lbl">Contacts</div></div>
          <div class="kpi"><div class="kpi-val">${dealsWon}</div><div class="kpi-lbl">Deals gagnés</div></div>
          <div class="kpi"><div class="kpi-val">${totalCA.toLocaleString("fr-FR")} DT</div><div class="kpi-lbl">CA total</div></div>
          <div class="kpi"><div class="kpi-val">${tasksDone}</div><div class="kpi-lbl">Tâches terminées</div></div>
        </div>

        <h2>Mon chiffre d'affaires par mois</h2>
        <p style="color:#64748b;font-size:12px;margin:0 0 10px;">CA rapporté par mois — total ${myCA.toLocaleString("fr-FR")} DT sur ${myContacts.length} client(s) assigné(s)</p>
        ${chartSvg}

        <h2>Mes clients assignés (${myContacts.length})</h2>
        <table>
          <tr><th>#</th><th>Nom</th><th>Entreprise</th><th>Email</th><th>Téléphone</th><th>Service</th><th>CA</th><th>Dernier contact</th></tr>
          ${myContacts.length ? myContacts.map((c, i) => `
            <tr>
              <td>${c.contactId ?? i+1}</td>
              <td>${c.Name ?? ""} ${c.Lastname ?? ""}</td>
              <td>${c.Company ?? "—"}</td>
              <td>${c.Email ?? "—"}</td>
              <td>${c.Phone ?? "—"}</td>
              <td>${Array.isArray(c.service) ? (c.service.join(", ") || "—") : (c.service ?? "—")}</td>
              <td>${c.DealValue ? Number(c.DealValue).toLocaleString("fr-FR") + " DT" : "—"}</td>
              <td>${c.lastContact ?? "—"}</td>
            </tr>`).join("") : `<tr><td colspan="8" style="text-align:center;color:#94a3b8;">Aucun client assigné</td></tr>`}
        </table>

        <h2>Contacts (${contacts.length})</h2>
        <table>
          <tr><th>#</th><th>Nom</th><th>Entreprise</th><th>Email</th><th>Téléphone</th><th>Type</th><th>CA</th></tr>
          ${contacts.map((c, i) => `
            <tr>
              <td>${c.contactId ?? i+1}</td>
              <td>${c.Name ?? ""} ${c.Lastname ?? ""}</td>
              <td>${c.Company ?? "—"}</td>
              <td>${c.Email ?? "—"}</td>
              <td>${c.Phone ?? "—"}</td>
              <td>${c.type ?? "—"}</td>
              <td>${c.DealValue ? Number(c.DealValue).toLocaleString("fr-FR") + " DT" : "—"}</td>
            </tr>`).join("")}
        </table>

        <h2>Prospects (${prospects.length})</h2>
        <table>
          <tr><th>#</th><th>Nom</th><th>Entreprise</th><th>Étape</th><th>Valeur</th><th>Probabilité</th></tr>
          ${prospects.map((p, i) => `
            <tr>
              <td>${p.prospectId ?? i+1}</td>
              <td>${p.Name ?? ""} ${p.Lastname ?? ""}</td>
              <td>${p.company ?? "—"}</td>
              <td>${p.stage ?? "—"}</td>
              <td>${p.value ? Number(p.value).toLocaleString("fr-FR") + " DT" : "—"}</td>
              <td>${p.probability ?? 0}%</td>
            </tr>`).join("")}
        </table>

        <h2>Tâches (${tasks.length})</h2>
        <table>
          <tr><th>Titre</th><th>Priorité</th><th>Statut</th><th>Assigné à</th><th>Échéance</th></tr>
          ${tasks.map(t => `
            <tr>
              <td>${t.title ?? "—"}</td>
              <td>${t.priority ?? "—"}</td>
              <td>${t.status ?? t.column ?? "—"}</td>
              <td>${t.assignee ?? "—"}</td>
              <td>${t.dueDate ?? "—"}</td>
            </tr>`).join("")}
        </table>

        <h2>Calendrier — Rendez-vous (${meetings.length})</h2>
        <table>
          <tr><th>Titre</th><th>Date</th><th>Heure</th><th>Type</th><th>Lieu</th><th>Participants</th></tr>
          ${meetings.map(m => `
            <tr>
              <td>${m.title ?? "—"}</td>
              <td>${m.date ?? "—"}</td>
              <td>${m.startTime ?? "—"} – ${m.endTime ?? "—"}</td>
              <td>${m.type ?? "—"}</td>
              <td>${m.location ?? "—"}</td>
              <td>${m.participants ?? "—"}</td>
            </tr>`).join("")}
        </table>

        <div class="footer">CRM Arabsoft · Rapport confidentiel · ${today}</div>
        </body></html>
      `;

      // Open in new window and trigger print-to-PDF
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      }
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    setDeleteError("");
    setDeleting(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      // Delete Firestore user document
      await deleteDoc(doc(db, "users", user.uid));
      // Delete Firebase Auth account
      await deleteUser(user);
      // Sign out and close — App.tsx will redirect to login automatically
      onClose();
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setDeleteError("Mot de passe incorrect.");
      } else {
        setDeleteError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  // ── Sections ───────────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (section) {

      case "general":
        return (
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Thème d'affichage</h4>
              <div className="flex gap-3">
                {([{ id: "light" as const, label: "Clair", icon: Sun }, { id: "dark" as const, label: "Sombre", icon: Moon }]).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTheme(id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{ borderColor: theme === id ? "var(--primary)" : "var(--border)", background: theme === id ? "var(--accent)" : "var(--background)", color: theme === id ? "var(--primary)" : "var(--muted-foreground)" }}>
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
                  <button key={d} onClick={() => setDensity(d)}
                    className="flex-1 py-2 rounded-lg border text-sm capitalize transition-all"
                    style={{ borderColor: density === d ? "var(--primary)" : "var(--border)", background: density === d ? "var(--accent)" : "var(--background)", color: density === d ? "var(--primary)" : "var(--muted-foreground)" }}>
                    {d === "compact" ? "Compact" : d === "normal" ? "Normal" : "Confortable"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date format */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Format de date</h4>
              <select value={dateFormat} onChange={e => setDateFormat(e.target.value as typeof dateFormat)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="dd/mm/yyyy">JJ/MM/AAAA (ex. 05/06/2026)</option>
                <option value="mm/dd/yyyy">MM/JJ/AAAA (ex. 06/05/2026)</option>
                <option value="yyyy-mm-dd">AAAA-MM-JJ (ex. 2026-06-05)</option>
              </select>
            </div>

            {/* Currency with live conversion */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Devise d'affichage</h4>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="DT">Dinar Tunisien (DT)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar américain ($)</option>
              </select>
              {currency !== "DT" && (
                <div className="mt-2 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--accent)" }}>
                  {rateLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground"><Loader2 size={12} className="animate-spin" />Récupération du taux…</span>
                  ) : rate ? (
                    <span className="text-foreground">
                      Taux en temps réel : <strong>1 DT = {rate.toFixed(4)} {currency === "EUR" ? "€" : "$"}</strong>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Taux indisponible</span>
                  )}
                </div>
              )}
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
            {notifsLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /><span className="text-sm">Chargement…</span>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Canaux de notification</h4>
                  <div className="space-y-3">
                    {([
                      { key: "email"        as const, label: "Notifications par email",    desc: "Recevoir les alertes par email" },
                      { key: "browser"      as const, label: "Notifications navigateur",   desc: "Afficher des notifications dans le navigateur" },
                      { key: "soundEnabled" as const, label: "Sons de notification",       desc: "Jouer un son lors des alertes" },
                    ]).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                        <Toggle value={notifs[key]} onChange={() => handleNotifToggle(key)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Événements</h4>
                  <div className="space-y-3">
                    {([
                      { key: "newContact"      as const, label: "Nouveau contact",       desc: "Quand un contact est créé" },
                      { key: "taskDue"         as const, label: "Tâche en retard",       desc: "Quand une échéance est dépassée" },
                      { key: "meetingReminder" as const, label: "Rappel de réunion",     desc: "30 min avant chaque RDV" },
                      { key: "dealUpdate"      as const, label: "Mise à jour prospect",  desc: "Changement d'étape dans le pipeline" },
                      { key: "weeklyReport"    as const, label: "Rapport hebdomadaire",  desc: "Résumé chaque lundi matin" },
                    ]).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                        <Toggle value={notifs[key]} onChange={() => handleNotifToggle(key)} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "security":
        return (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Activité</h4>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Journal d'activité</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Conserver l'historique des connexions</p>
                </div>
                <Toggle value={showActivity} onChange={setShowActivity} />
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
                {([
                  { label: "Collecte de données d'utilisation", desc: "Aide à améliorer l'application", value: dataCollection, onChange: setDataCollection },
                  { label: "Rapports d'erreurs automatiques",   desc: "Envoyer les erreurs pour diagnostic", value: crashReports, onChange: setCrashReports },
                ]).map(({ label, desc, value, onChange }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                    <Toggle value={value} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Gestion des données</h4>

              {/* Export PDF */}
              <button onClick={handleExportPDF} disabled={exporting}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm disabled:opacity-60">
                <span className="text-foreground flex items-center gap-2">
                  {exporting && <Loader2 size={13} className="animate-spin" />}
                  {exporting ? "Génération du PDF…" : "Exporter mes données (PDF)"}
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>

              {/* Delete account */}
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors hover:bg-red-50"
                  style={{ borderColor: "#FCA5A5" }}>
                  <span style={{ color: "#EF4444" }}>Supprimer mon compte</span>
                  <ChevronRight size={14} style={{ color: "#EF4444" }} />
                </button>
              ) : (
                <div className="border border-red-200 rounded-xl p-4 space-y-3" style={{ background: "#FFF5F5" }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>Supprimer définitivement le compte</p>
                      <p className="text-xs text-muted-foreground mt-1">Cette action est irréversible. Toutes vos données seront supprimées.</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirmez votre mot de passe</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={e => { setDeletePassword(e.target.value); setDeleteError(""); }}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                  {deleteError && <p className="text-xs" style={{ color: "#EF4444" }}>{deleteError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
                      Annuler
                    </button>
                    <button onClick={handleDeleteAccount} disabled={deleting || !deletePassword}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: "#EF4444" }}>
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : null}
                      {deleting ? "Suppression…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              )}
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
              <button key={s.id} onClick={() => setSection(s.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left"
                style={{ background: isActive ? "var(--accent)" : "transparent", color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}>
                <Icon size={14} />{s.label}
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

          <div className="flex-1 overflow-y-auto px-6 py-5">{renderSection()}</div>

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