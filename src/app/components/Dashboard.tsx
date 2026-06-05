import { TrendingUp, Users, CheckCircle, ArrowUpRight, ArrowDownRight, Clock, Star } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 138600, target: 125400 },
  { month: "Fév", revenue: 127050, target: 132000 },
  { month: "Mar", revenue: 168300, target: 145200 },
  { month: "Avr", revenue: 155760, target: 151800 },
  { month: "Mai", revenue: 191400, target: 165000 },
  { month: "Jun", revenue: 179190, target: 171600 },
  { month: "Juil", revenue: 209220, target: 184800 },
  { month: "Aoû", revenue: 197340, target: 191400 },
];

const pipelineData = [
  { stage: "Prospection", value: 24 },
  { stage: "Qualif.", value: 18 },
  { stage: "Devis", value: 12 },
  { stage: "Négociation", value: 8 },
  { stage: "Gagné", value: 15 },
];

const pieData = [
  { name: "Clients actifs", value: 48 },
  { name: "Prospects chauds", value: 23 },
  { name: "Prospects froids", value: 19 },
  { name: "Inactifs", value: 10 },
];
const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#94A3B8"];

const recentActivities = [
  { id: 1, type: "deal", text: "Contrat signé — Société Chaouachi", time: "il y a 12 min", value: "+61 050 DT", positive: true },
  { id: 2, type: "contact", text: "Nouveau contact — Meriem Trabelsi, DRH", time: "il y a 45 min", value: "", positive: true },
  { id: 3, type: "task", text: "Relance prévue pour TechVentures Tunis manquée", time: "il y a 2h", value: "", positive: false },
  { id: 4, type: "deal", text: "Proposition envoyée — Groupe Mrabet", time: "il y a 3h", value: "39 600 DT", positive: true },
  { id: 5, type: "meeting", text: "Réunion confirmée — Innovatech Tunisie mardi 10h", time: "il y a 5h", value: "", positive: true },
];

const kpis = [
  { label: "Chiffre d'affaires", value: "1 529 000 DT", change: "+12.4%", up: true, icon: TrendingUp, color: "#2563EB", bg: "#DBEAFE" },
  { label: "Contacts actifs", value: "347", change: "+8 ce mois", up: true, icon: Users, color: "#10B981", bg: "#D1FAE5" },
  { label: "Tâches en cours", value: "28", change: "5 en retard", up: false, icon: CheckCircle, color: "#F59E0B", bg: "#FEF3C7" },
  { label: "Taux de conversion", value: "24.3%", change: "+2.1 pts", up: true, icon: TrendingUp, color: "#8B5CF6", bg: "#EDE9FE" },
];

function KPICard({ kpi }: { kpi: typeof kpis[0] }) {
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

export function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Jeudi 4 juin 2026 — Bienvenue, Ahmed</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option>Ce trimestre</option>
            <option>Ce mois</option>
            <option>Cette année</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => <KPICard key={kpi.label} kpi={kpi} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground">Chiffre d'affaires</h3>
              <p className="text-xs text-muted-foreground">Réalisé vs Objectif</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: "#2563EB", display: "inline-block" }}></span>Réalisé</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded border-dashed border-t-2" style={{ borderColor: "#10B981", display: "inline-block" }}></span>Objectif</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", fontSize: 12 }}
                labelStyle={{ color: "#CBD5E1" }}
                itemStyle={{ color: "#F1F5F9" }}
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")} DT`]}
              />
              <Area key="revenue" type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" />
              <Area key="target" type="monotone" dataKey="target" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-foreground mb-1">Répartition contacts</h3>
          <p className="text-xs text-muted-foreground mb-4">Total : 347 contacts</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="#F1F5F9">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", fontSize: 12 }} itemStyle={{ color: "#F1F5F9" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }}></span>
                  <span className="text-muted-foreground">{d.name}</span>
                </span>
                <span className="font-medium text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-foreground mb-1">Pipeline commercial</h3>
          <p className="text-xs text-muted-foreground mb-4">Deals par étape</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={pipelineData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "8px", fontSize: 12 }} itemStyle={{ color: "#F1F5F9" }} />
              <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Activité récente</h3>
            <button className="text-xs text-primary hover:underline">Tout voir</button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: a.positive ? "#D1FAE5" : "#FEE2E2" }}>
                  {a.positive ? <Star size={12} color="#10B981" /> : <Clock size={12} color="#EF4444" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
                {a.value && (
                  <span className="text-xs font-semibold shrink-0" style={{ color: "#10B981" }}>{a.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
