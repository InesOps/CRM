import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Users, MapPin, X, Check, Trash2, Pencil } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: string;
  location: string;
  type: "meeting" | "call" | "demo" | "internal";
  notes: string;
}

const TYPE_STYLES = {
  meeting: { label: "Réunion", color: "#2563EB", bg: "#DBEAFE" },
  call: { label: "Appel", color: "#10B981", bg: "#D1FAE5" },
  demo: { label: "Démo", color: "#8B5CF6", bg: "#EDE9FE" },
  internal: { label: "Interne", color: "#64748B", bg: "#F1F5F9" },
};

const initMeetings: Meeting[] = [
  { id: "m1", title: "Réunion kick-off Innovatech Tunisie", date: "2026-06-09", startTime: "10:00", endTime: "11:30", participants: "Sirine Rekik, Ahmed Salhi", location: "Salle Apollo", type: "meeting", notes: "Présentation du nouveau module SaaS" },
  { id: "m2", title: "Appel de suivi Groupe Mrabet", date: "2026-06-10", startTime: "14:00", endTime: "14:30", participants: "Meriem Trabelsi", location: "Téléphone", type: "call", notes: "Point sur le devis révisé" },
  { id: "m3", title: "Démo produit TechVentures Tunis", date: "2026-06-11", startTime: "09:30", endTime: "10:30", participants: "Tarek Ben Youssef", location: "Visio Teams", type: "demo", notes: "" },
  { id: "m4", title: "Réunion équipe commerciale", date: "2026-06-12", startTime: "09:00", endTime: "10:00", participants: "Équipe commerciale", location: "Salle principale", type: "internal", notes: "Revue hebdomadaire KPIs" },
  { id: "m5", title: "Présentation Groupe Mrabet", date: "2026-06-16", startTime: "11:00", endTime: "12:30", participants: "Meriem Trabelsi, Hedi Mrabet", location: "Chez le client", type: "meeting", notes: "Présentation nouvelle offre" },
  { id: "m6", title: "Appel DataFlow Tunisie", date: "2026-06-04", startTime: "15:00", endTime: "15:30", participants: "Ines Jlassi", location: "Téléphone", type: "call", notes: "Premier contact" },
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days: (number | null)[] = Array(offset).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function MeetingModal({ meeting, onClose, onSave }: { meeting: Partial<Meeting> | null; onClose: () => void; onSave: (m: Meeting) => void }) {
  const [form, setForm] = useState<Partial<Meeting>>(meeting || { type: "meeting", date: new Date().toISOString().split("T")[0] });
  const handleSave = () => {
    if (!form.title || !form.date) return;
    onSave({ id: form.id || `m${Date.now()}`, title: form.title, date: form.date, startTime: form.startTime || "09:00", endTime: form.endTime || "10:00", participants: form.participants || "", location: form.location || "", type: form.type || "meeting", notes: form.notes || "" });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2>{form.id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titre *</label>
            <input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Titre du rendez-vous" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date *</label>
              <input type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Début</label>
              <input type="time" value={form.startTime || ""} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin</label>
              <input type="time" value={form.endTime || ""} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Meeting["type"] }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="meeting">Réunion</option>
                <option value="call">Appel</option>
                <option value="demo">Démo</option>
                <option value="internal">Interne</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lieu</label>
              <input value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Salle, visio…" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</label>
            <input value={form.participants || ""} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Noms des participants" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={2} placeholder="Notes…" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Annuler</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90" style={{ background: "var(--primary)" }}>
            <Check size={14} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [meetings, setMeetings] = useState<Meeting[]>(initMeetings);
  const [editingMeeting, setEditingMeeting] = useState<Partial<Meeting> | null | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = getCalendarDays(year, month);
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getMeetingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return meetings.filter(m => m.date === dateStr);
  };

  const selectedMeetings = selectedDate ? meetings.filter(m => m.date === selectedDate) : meetings.filter(m => m.date === todayStr);

  const handleSave = (m: Meeting) => {
    setMeetings(ms => {
      const idx = ms.findIndex(x => x.id === m.id);
      return idx >= 0 ? ms.map(x => x.id === m.id ? m : x) : [...ms, m];
    });
  };

  const upcomingMeetings = meetings
    .filter(m => m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-foreground">Calendrier</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{meetings.length} rendez-vous planifiés</p>
        </div>
        <button onClick={() => setEditingMeeting({ date: selectedDate || todayStr })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-colors" style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Nouveau RDV
        </button>
      </div>

      <div className="flex gap-5 flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft size={16} /></button>
              <h2 className="text-foreground">{MONTHS_FR[month]} {year}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight size={16} /></button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_FR.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayMeetings = getMeetingsForDay(day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <button key={dateStr} onClick={() => setSelectedDate(dateStr)} className="min-h-[68px] p-1.5 rounded-xl text-left transition-all hover:bg-muted/60"
                    style={{ background: isSelected ? "#DBEAFE" : isToday ? "#EFF6FF" : "transparent", border: isToday ? "1.5px solid #93C5FD" : "1.5px solid transparent" }}>
                    <span className="block text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                      style={{ background: isToday ? "var(--primary)" : "transparent", color: isToday ? "white" : isSelected ? "var(--primary)" : "var(--foreground)", fontWeight: isToday || isSelected ? 600 : 400 }}>
                      {day}
                    </span>
                    {dayMeetings.slice(0, 2).map(m => {
                      const ts = TYPE_STYLES[m.type];
                      return (
                        <div key={m.id} className="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate" style={{ background: ts.bg, color: ts.color }}>{m.title}</div>
                      );
                    })}
                    {dayMeetings.length > 2 && <div className="text-xs text-muted-foreground pl-1">+{dayMeetings.length - 2}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
          {/* Selected day meetings */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-foreground mb-3">
              {selectedDate ? new Date(selectedDate + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "Aujourd'hui"}
            </h3>
            <div className="space-y-2">
              {selectedMeetings.length === 0 && <p className="text-sm text-muted-foreground">Aucun rendez-vous ce jour</p>}
              {selectedMeetings.map(m => {
                const ts = TYPE_STYLES[m.type];
                return (
                  <div key={m.id} className="rounded-xl p-3 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setEditingMeeting(m)} className="p-1 rounded hover:bg-muted"><Pencil size={11} className="text-muted-foreground" /></button>
                        <button onClick={() => setMeetings(ms => ms.filter(x => x.id !== m.id))} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} color="#EF4444" /></button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={10} /> {m.startTime} – {m.endTime}
                      </div>
                      {m.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={10} />{m.location}</div>}
                      {m.participants && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={10} />{m.participants}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-foreground mb-3">Prochains RDV</h3>
            <div className="space-y-2">
              {upcomingMeetings.map(m => {
                const ts = TYPE_STYLES[m.type];
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: ts.bg, color: ts.color }}>
                      {new Date(m.date + "T12:00").getDate()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {m.startTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {editingMeeting !== undefined && (
        <MeetingModal meeting={editingMeeting} onClose={() => setEditingMeeting(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}
