import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Clock, Users, MapPin, X, Check, Trash2, Pencil, Loader2 } from "lucide-react";
import {
  getCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
} from "../../firebase/crud/calendar";
import { getAllStaff, type StaffMember } from "../../firebase/crud/users";
import type { UserRole } from "../../hooks/useAuth";

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

interface CalendarViewProps {
  role: UserRole | null;
  userId: string;
}

const TYPE_STYLES = {
  meeting:  { label: "Réunion", color: "#2563EB", bg: "#DBEAFE" },
  call:     { label: "Appel",   color: "#10B981", bg: "#D1FAE5" },
  demo:     { label: "Démo",    color: "#8B5CF6", bg: "#EDE9FE" },
  internal: { label: "Interne", color: "#64748B", bg: "#F1F5F9" },
};

const DAYS_FR   = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function getCalendarDays(year: number, month: number) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const days: (number | null)[] = Array(offset).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function MeetingModal({ meeting, saving, onClose, onSave, staff }: {
  meeting: Partial<Meeting>;
  saving: boolean;
  onClose: () => void;
  onSave: (m: Omit<Meeting, "id">, existingId?: string) => void;
  staff: StaffMember[];
}) {
  const [form, setForm] = useState<Partial<Meeting>>(meeting);

  const getStaffName = (member: StaffMember) =>
    [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;

  // All members except admins
  const selectableStaff = staff.filter(m => m.role !== "admin");

  const [selectedStaff, setSelectedStaff] = useState<string[]>(() => {
    if (!meeting.participants) return [];
    const names = meeting.participants.split(",").map(s => s.trim()).filter(Boolean);
    return staff.filter(m => names.includes(getStaffName(m))).map(m => m.uid);
  });

  // Participants dropdown open/close
  const [staffOpen, setStaffOpen] = useState(false);
  const staffRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) setStaffOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const set = (k: keyof Meeting, v: any) => setForm(f => ({ ...f, [k]: v }));
  const canSave = !!form.title?.trim() && !!form.date;

  const toggleStaff = (uid: string) =>
    setSelectedStaff(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);

  const participantsValue = selectedStaff
    .map(uid => { const m = staff.find(s => s.uid === uid); return m ? getStaffName(m) : uid; })
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">{meeting.id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} className="text-muted-foreground" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Titre *</label>
            <input value={form.title || ""} onChange={e => set("title", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date *</label>
              <input type="date" value={form.date || ""} onChange={e => set("date", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Début</label>
              <input type="time" value={form.startTime || ""} onChange={e => set("startTime", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin</label>
              <input type="time" value={form.endTime || ""} onChange={e => set("endTime", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
              <select value={form.type ?? "meeting"} onChange={e => set("type", e.target.value as Meeting["type"])}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="meeting">Réunion</option>
                <option value="call">Appel</option>
                <option value="demo">Démo</option>
                <option value="internal">Interne (équipe)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lieu</label>
              <input value={form.location || ""} onChange={e => set("location", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Participants: dropdown multi-select of team members (admins excluded) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Participants</label>
            <div className="relative mt-1" ref={staffRef}>
              <button type="button" onClick={() => setStaffOpen(o => !o)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30">
                <span className="flex flex-wrap gap-1.5 items-center min-h-[1.25rem] text-left">
                  {selectedStaff.length === 0
                    ? <span className="text-muted-foreground">Sélectionner des membres…</span>
                    : selectedStaff.map(uid => {
                        const m = staff.find(s => s.uid === uid);
                        const name = m ? getStaffName(m) : uid;
                        return (
                          <span key={uid} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border">
                            {name}
                            <span onClick={e => { e.stopPropagation(); toggleStaff(uid); }} className="text-muted-foreground hover:text-red-400">
                              <X size={10} />
                            </span>
                          </span>
                        );
                      })}
                </span>
                <ChevronDown size={14} className="text-muted-foreground shrink-0" />
              </button>
              {staffOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-xl">
                  {selectableStaff.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground">Aucun membre disponible.</div>
                  ) : selectableStaff.map(member => {
                    const checked = selectedStaff.includes(member.uid);
                    return (
                      <button key={member.uid} type="button" onClick={() => toggleStaff(member.uid)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors">
                        <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                          style={{ background: checked ? "var(--primary)" : "transparent", borderColor: checked ? "var(--primary)" : "var(--border)" }}>
                          {checked && <Check size={11} color="white" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm text-foreground truncate">{getStaffName(member)}</span>
                          <span className="block text-xs text-muted-foreground truncate">{member.email}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={2} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({
              title:        form.title!,
              date:         form.date!,
              startTime:    form.startTime    ?? "09:00",
              endTime:      form.endTime      ?? "10:00",
              type:         form.type         ?? "meeting",
              location:     form.location     ?? "",
              participants: participantsValue,
              notes:        form.notes        ?? "",
            }, meeting.id)}
            disabled={saving || !canSave}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarView(_props: CalendarViewProps) {
  const today = new Date();
  const [year,           setYear]           = useState(today.getFullYear());
  const [month,          setMonth]          = useState(today.getMonth());
  const [meetings,       setMeetings]       = useState<Meeting[]>([]);
  const [staff,          setStaff]          = useState<StaffMember[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Partial<Meeting> | undefined>(undefined);
  const [selectedDate,   setSelectedDate]   = useState<string | null>(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState<string | null>(null);

  const days     = getCalendarDays(year, month);
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [calSnap, staffList] = await Promise.all([
          getCalendarEvents(),
          getAllStaff(),
        ]);
        setMeetings(calSnap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting)));
        setStaff(staffList);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async (formData: Omit<Meeting, "id">, existingId?: string) => {
    setSaving(true);
    try {
      if (existingId) {
        await updateCalendarEvent(existingId, formData);
        setMeetings(ms => ms.map(m => m.id === existingId ? { id: existingId, ...formData } : m));
      } else {
        const ref = await addCalendarEvent(formData);
        setMeetings(ms => [...ms, { id: ref.id, ...formData }]);
      }
      setEditingMeeting(undefined);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCalendarEvent(id);
      setMeetings(ms => ms.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const getMeetingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return meetings.filter(m => m.date === dateStr);
  };

  const selectedMeetings = selectedDate
    ? meetings.filter(m => m.date === selectedDate)
    : meetings.filter(m => m.date === todayStr);

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
        <button
          onClick={() => setEditingMeeting({ date: selectedDate || todayStr, type: "meeting" })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
          style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Nouveau RDV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" /><span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <div className="flex gap-5 flex-1 overflow-hidden">
          {/* Calendar grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft size={16} /></button>
                <h2 className="text-foreground">{MONTHS_FR[month]} {year}</h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {DAYS_FR.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const dateStr    = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayMeetings = getMeetingsForDay(day);
                  const isToday    = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                      className="min-h-[68px] p-1.5 rounded-xl text-left transition-all hover:bg-muted/60"
                      style={{ background: isSelected ? "#DBEAFE" : isToday ? "#EFF6FF" : "transparent", border: isToday ? "1.5px solid #93C5FD" : "1.5px solid transparent" }}>
                      <span className="block text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ background: isToday ? "var(--primary)" : "transparent", color: isToday ? "white" : isSelected ? "var(--primary)" : "var(--foreground)", fontWeight: isToday || isSelected ? 600 : 400 }}>
                        {day}
                      </span>
                      {dayMeetings.slice(0, 2).map(m => {
                        const ts = TYPE_STYLES[m.type];
                        return <div key={m.id} className="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate" style={{ background: ts.bg, color: ts.color }}>{m.title}</div>;
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
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-foreground mb-3">
                {selectedDate
                  ? new Date(selectedDate + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                  : "Aujourd'hui"}
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
                          <button onClick={() => setEditingMeeting(m)} className="p-1 rounded hover:bg-muted">
                            <Pencil size={11} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => setDeleteConfirm(m.id)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 size={11} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={10} /> {m.startTime} – {m.endTime}
                        </div>
                        {m.location     && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={10} />{m.location}</div>}
                        {m.participants && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={10} />{m.participants}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-foreground mb-3">Prochains RDV</h3>
              <div className="space-y-2">
                {upcomingMeetings.length === 0 && <p className="text-sm text-muted-foreground">Aucun prochain rendez-vous</p>}
                {upcomingMeetings.map(m => {
                  const ts = TYPE_STYLES[m.type];
                  return (
                    <div key={m.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: ts.bg, color: ts.color }}>
                        {new Date(m.date + "T12:00").getDate()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {m.startTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingMeeting !== undefined && (
        <MeetingModal
          meeting={editingMeeting}
          saving={saving}
          staff={staff}
          onClose={() => setEditingMeeting(undefined)}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-foreground mb-2">Supprimer le rendez-vous</h2>
            <p className="text-sm text-muted-foreground mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: "#EF4444" }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
