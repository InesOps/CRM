import { useEffect, useState } from "react";
import { TrendingUp, Users, CheckCircle, ArrowUpRight, ArrowDownRight, Loader2, Clock, MapPin, Calendar } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";

const PIE_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#94A3B8"];

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  meeting:  { label: "Réunion", color: "#2563EB", bg: "#DBEAFE" },
  call:     { label: "Appel",   color: "#10B981", bg: "#D1FAE5" },
  demo:     { label: "Démo",    color: "#8B5CF6", bg: "#EDE9FE" },
  internal: { label: "Interne", color: "#64748B", bg: "#F1F5F9" },
};

const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Juil","Aoû","Sep","Oct","Nov","Déc"];

// ── useDashboard hook ─────────────────────────────────────────────────────────
function useDashboard() {
  const [data, setData] = useState({
    totalRevenue:    0,
    activeContacts:  0,
    tasksInProgress: 0,
    lateTasks:       0,
    tndToEur:        0,
    pipelineByStage: [] as { stage: string; value: number }[],
    contactsByType:  [] as { name: string; value: number }[],
    revenueByMonth:  [] as { month: string; revenue: number }[],
    upcomingMeetings: [] as {
      id: string; title: string; date: string;
      startTime: string; endTime: string;
      location: string; type: string;
    }[],
    loading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        // Fetch all data in parallel including live exchange rate
        const [contactsSnap, tasksSnap, prospectsSnap, calendarSnap, rateRes] = await Promise.all([
          getDocs(collection(db, "contacts")),
          getDocs(collection(db, "tasks")),
          getDocs(collection(db, "prospects")),
          getDocs(query(collection(db, "calendar"), orderBy("date"))),
          fetch("https://api.frankfurter.app/latest?from=EUR&to=TND").catch(() => null),
        ]);

        const contacts  = contactsSnap.docs.map(d => d.data());
        const tasks     = tasksSnap.docs.map(d => d.data());
        const prospects = prospectsSnap.docs.map(d => d.data());
        const meetings  = calendarSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const today     = new Date().toISOString().split("T")[0];

        // ── Exchange rate TND → EUR ───────────────────────────────────────────
        let tndToEur = 1 / 3.37; // fallback
        if (rateRes && rateRes.ok) {
          try {
            const rateData = await rateRes.json();
            const eurToTnd = rateData.rates?.TND;
            if (eurToTnd) tndToEur = 1 / eurToTnd;
          } catch (_) {}
        }

        // ── KPIs ──────────────────────────────────────────────────────────────
        const totalRevenue    = contacts.reduce((s, c) => s + (Number((c as any).DealValue) || 0), 0);
        const activeContacts  = contacts.filter(c => (c as any).status === "actif").length;
        const tasksInProgress = tasks.filter(t => (t as any).column !== "done").length;
        const lateTasks       = tasks.filter(t => (t as any).column !== "done" && (t as any).dueDate && (t as any).dueDate < today).length;

        // ── Revenue by month (from contacts createdAt) ────────────────────────
        const monthTotals: Record<number, number> = {};
        contacts.forEach(c => {
          const deal = Number((c as any).DealValue) || 0;
          if (!deal) return;
          // Try to get month from createdAt timestamp
          const createdAt = (c as any).createdAt;
          let monthIdx = new Date().getMonth(); // fallback to current month
          if (createdAt?.toDate) {
            monthIdx = createdAt.toDate().getMonth();
          } else if (typeof createdAt === "string") {
            monthIdx = new Date(createdAt).getMonth();
          }
          monthTotals[monthIdx] = (monthTotals[monthIdx] ?? 0) + deal;
        });
        // Build array for all 12 months, only showing months with data
        const revenueByMonth = Object.entries(monthTotals)
          .map(([m, revenue]) => ({ month: MONTHS_FR[Number(m)], revenue, monthIdx: Number(m) }))
          .sort((a, b) => a.monthIdx - b.monthIdx)
          .map(({ month, revenue }) => ({ month, revenue }));

        // ── Pipeline ──────────────────────────────────────────────────────────
        const stageLabels: Record<string, string> = {
          identification: "Prospection",
          qualification:  "Qualif.",
          proposition:    "Devis",
          negociation:    "Négociation",
          gagne:          "Gagné",
          perdu:          "Perdu",
        };
        const stageCounts: Record<string, number> = {};
        prospects.forEach(p => {
          const stage = (p as any).stage;
          if (!stage) return;
          const label = stageLabels[stage];
          if (!label) return;
          stageCounts[label] = (stageCounts[label] ?? 0) + 1;
        });
        const pipelineByStage = Object.entries(stageCounts).map(([stage, value]) => ({ stage, value }));

        // ── Contacts pie ──────────────────────────────────────────────────────
        const typeCounts: Record<string, number> = {};
        contacts.forEach(c => {
          const type = (c as any).type;
          if (!type) return;
          typeCounts[type] = (typeCounts[type] ?? 0) + 1;
        });
        const typeLabels: Record<string, string> = {
          client: "Clients actifs", fournisseur: "Fournisseurs", partenaire: "Partenaires",
        };
        const contactsByType = Object.entries(typeCounts).map(([type, value]) => ({
          name: typeLabels[type] ?? type, value,
        }));

        // ── Upcoming meetings ─────────────────────────────────────────────────
        const upcomingMeetings = meetings
          .filter((m: any) => m.date >= today)
          .sort((a: any, b: any) =>
            a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "")
          )
          .slice(0, 6);

        setData({
          totalRevenue, activeContacts, tasksInProgress, lateTasks,
          tndToEur, pipelineByStage, contactsByType, revenueByMonth,
          upcomingMeetings, loading: false,
        });
      } catch (e) {
        console.error(e);
        setData(d => ({ ...d, loading: false }));
      }
    })();
  }, []);

  return data;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ kpi }: { kpi: { label: string; value: string; change: string; up: boolean; icon: any; color: string; bg: string } }) {
  const Icon = kpi.icon;
  return (
    <div className="bg-card rounded-xl p-5 border border-border flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: kpi.bg }}>
        <Icon size={20} style={{ color: kpi.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
        <p className="text-xl font-semibold text-foreground">{kpi.value}</p>
        <div className="flex items-center gap-1 mt-1">
          {kpi.up ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
          <span className="text-xs" style={{ color: kpi.up ? "#10B981" : "#EF4444" }}>{kpi.change}</span>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const stats = useDashboard();

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: `${stats.totalRevenue.toLocaleString("fr-FR")} DT`,
      change: "+12.4%",
      up: true,
      icon: TrendingUp,
      color: "#2563EB",
      bg: "#DBEAFE",
    },
    {
      label: "Contacts actifs",
      value: `${stats.activeContacts}`,
      change: "+8 ce mois",
      up: true,
      icon: Users,
      color: "#10B981",
      bg: "#D1FAE5",
    },
    {
      label: "Tâches en cours",
      value: `${stats.tasksInProgress}`,
      change: stats.lateTasks > 0 ? `${stats.lateTasks} en retard` : "Tout à jour",
      up: stats.lateTasks === 0,
      icon: CheckCircle,
      color: "#F59E0B",
      bg: "#FEF3C7",
    },
    {
      label: "Taux DT → EUR",
      value: stats.tndToEur > 0 ? `1 DT = ${stats.tndToEur.toFixed(4)} €` : "—",
      change: "Taux en temps réel",
      up: true,
      icon: TrendingUp,
      color: "#8B5CF6",
      bg: "#EDE9FE",
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Chargement du tableau de bord…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — Bienvenue
          </p>
        </div>
        <select className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option>Ce trimestre</option>
          <option>Ce mois</option>
          <option>Cette année</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(kpi => <KPICard key={kpi.label} kpi={kpi} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue from Firestore contacts */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground">Chiffre d'affaires</h3>
              <p className="text-xs text-muted-foreground">CA par mois — données clients</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "#DBEAFE", color: "#2563EB" }}>
              {stats.totalRevenue.toLocaleString("fr-FR")} DT total
            </span>
          </div>
          {stats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "#CBD5E1" }} itemStyle={{ color: "#F1F5F9" }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-FR")} DT`, "CA"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Aucun client avec CA enregistré pour l'instant
            </div>
          )}
        </div>

        {/* Contacts pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-foreground mb-1">Répartition contacts</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Total : {stats.contactsByType.reduce((s, c) => s + c.value, 0)} contacts
          </p>
          {stats.contactsByType.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={stats.contactsByType} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="var(--card)">
                    {stats.contactsByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", fontSize: 12 }} itemStyle={{ color: "#F1F5F9" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {stats.contactsByType.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </span>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun contact</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-foreground mb-1">Pipeline commercial</h3>
          <p className="text-xs text-muted-foreground mb-4">Deals par étape</p>
          {stats.pipelineByStage.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={stats.pipelineByStage} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", fontSize: 12 }} itemStyle={{ color: "#F1F5F9" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.pipelineByStage.map((entry, index) => (
                    <Cell key={index} fill={entry.stage === "Perdu" ? "#EF4444" : "#2563EB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun prospect</p>
          )}
        </div>

        {/* Mini agenda */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground">Agenda à venir</h3>
              <p className="text-xs text-muted-foreground">Prochains rendez-vous</p>
            </div>
            <Calendar size={16} className="text-muted-foreground" />
          </div>

          {stats.upcomingMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Calendar size={24} className="opacity-30" />
              <p className="text-sm">Aucun rendez-vous à venir</p>
            </div>
          ) : (
            <div className="space-y-0">
              {stats.upcomingMeetings.map(m => {
                const ts         = TYPE_STYLES[m.type] ?? TYPE_STYLES.meeting;
                const dateObj    = new Date(m.date + "T12:00");
                const isToday    = m.date === new Date().toISOString().split("T")[0];
                const isTomorrow = m.date === new Date(Date.now() + 86400000).toISOString().split("T")[0];
                return (
                  <div key={m.id} className="flex items-start gap-4 py-3 border-b border-border last:border-0">
                    <div className="w-12 shrink-0 text-center">
                      <div className="text-xs font-semibold rounded-lg py-1.5 px-1"
                        style={{ background: isToday ? "var(--primary)" : ts.bg, color: isToday ? "white" : ts.color }}>
                        <div className="text-lg font-bold leading-none">{dateObj.getDate()}</div>
                        <div className="text-xs opacity-80 mt-0.5">
                          {dateObj.toLocaleDateString("fr-FR", { month: "short" })}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: ts.bg, color: ts.color }}>
                          {ts.label}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: "#FEF3C7", color: "#F59E0B" }}>
                            Aujourd'hui
                          </span>
                        )}
                        {isTomorrow && !isToday && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: "#EDE9FE", color: "#8B5CF6" }}>
                            Demain
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} /> {m.startTime}{m.endTime ? ` – ${m.endTime}` : ""}
                        </span>
                        {m.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin size={10} /> {m.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}