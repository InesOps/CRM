import { useState } from "react";
import { Search, Plus, Filter, Mail, Phone, Building, Tag, Trash2, Edit2, Check, X, ChevronDown } from "lucide-react";

type ContactType = "client" | "prospect" | "fournisseur" | "partenaire";

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: ContactType;
  status: "actif" | "inactif";
  lastContact: string;
  tags: string[];
  revenue?: string;
}

const TYPE_STYLES: Record<ContactType, { label: string; color: string; bg: string }> = {
  client: { label: "Client", color: "#2563EB", bg: "#DBEAFE" },
  prospect: { label: "Prospect", color: "#F59E0B", bg: "#FEF3C7" },
  fournisseur: { label: "Fournisseur", color: "#8B5CF6", bg: "#EDE9FE" },
  partenaire: { label: "Partenaire", color: "#10B981", bg: "#D1FAE5" },
};

const initContacts: Contact[] = [
  { id: "c1", name: "Meriem Trabelsi", company: "Groupe Mrabet", email: "m.trabelsi@mrabet.tn", phone: "+216 98 123 456", type: "client", status: "actif", lastContact: "2026-06-02", tags: ["VIP", "Grand compte"], revenue: "158 400 DT" },
  { id: "c2", name: "Mohamed Chaouachi", company: "Société Chaouachi", email: "m.chaouachi@chaouachi.tn", phone: "+216 97 234 567", type: "client", status: "actif", lastContact: "2026-06-04", tags: ["Grand compte"], revenue: "61 050 DT" },
  { id: "c3", name: "Sirine Rekik", company: "Innovatech Tunisie", email: "s.rekik@innovatech.tn", phone: "+216 55 345 678", type: "prospect", status: "actif", lastContact: "2026-05-28", tags: ["Chaud"], revenue: undefined },
  { id: "c4", name: "Tarek Ben Youssef", company: "TechVentures Tunis", email: "t.benyoussef@techventures.tn", phone: "+216 22 456 789", type: "prospect", status: "actif", lastContact: "2026-05-15", tags: ["Froid"], revenue: undefined },
  { id: "c5", name: "Houda Mansouri", company: "Print & Design Tunis", email: "h.mansouri@printdesign.tn", phone: "+216 71 567 890", type: "fournisseur", status: "actif", lastContact: "2026-04-20", tags: ["Imprimerie"], revenue: undefined },
  { id: "c6", name: "Karim Belhaj", company: "CloudSoft Tunisie", email: "k.belhaj@cloudsoft.tn", phone: "+216 99 678 901", type: "fournisseur", status: "actif", lastContact: "2026-05-10", tags: ["IT", "Cloud"], revenue: undefined },
  { id: "c7", name: "Amira Ghedira", company: "Agence Boost", email: "a.ghedira@boost.tn", phone: "+216 50 789 012", type: "partenaire", status: "actif", lastContact: "2026-06-01", tags: ["Marketing"], revenue: undefined },
  { id: "c8", name: "Nabil Kraiem", company: "ERP Solutions Tunis", email: "n.kraiem@erpsolutions.tn", phone: "+216 25 890 123", type: "client", status: "inactif", lastContact: "2026-03-12", tags: [], revenue: "20 460 DT" },
  { id: "c9", name: "Ines Jlassi", company: "DataFlow Tunisie", email: "i.jlassi@dataflow.tn", phone: "+216 53 901 234", type: "prospect", status: "actif", lastContact: "2026-05-30", tags: ["Chaud", "SaaS"], revenue: undefined },
  { id: "c10", name: "Maher Hamdi", company: "Logistique Express", email: "m.hamdi@logexpress.tn", phone: "+216 98 012 345", type: "client", status: "actif", lastContact: "2026-05-25", tags: ["Logistique"], revenue: "73 590 DT" },
];

function ContactModal({ contact, onClose, onSave }: { contact: Partial<Contact> | null; onClose: () => void; onSave: (c: Contact) => void }) {
  const [form, setForm] = useState<Partial<Contact>>(contact || { type: "prospect", status: "actif", tags: [] });
  const handleSave = () => {
    if (!form.name || !form.email) return;
    onSave({ id: form.id || `c${Date.now()}`, name: form.name, company: form.company || "", email: form.email, phone: form.phone || "", type: form.type || "prospect", status: form.status || "actif", lastContact: form.lastContact || new Date().toISOString().split("T")[0], tags: form.tags || [] });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2>{form.id ? "Modifier le contact" : "Nouveau contact"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom complet *</label>
            <input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Prénom Nom" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entreprise</label>
            <input value={form.company || ""} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nom de l'entreprise" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContactType }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="client">Client</option>
              <option value="prospect">Prospect</option>
              <option value="fournisseur">Fournisseur</option>
              <option value="partenaire">Partenaire</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email *</label>
            <input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="email@exemple.fr" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
            <input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="+33 6 00 00 00 00" />
          </div>
          {form.type === "client" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CA annuel</label>
              <input value={form.revenue || ""} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="ex: 12 000 €" />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Annuler</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors hover:opacity-90" style={{ background: "var(--primary)" }}>
            <Check size={14} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>(initContacts);
  const [filter, setFilter] = useState<ContactType | "all">("all");
  const [search, setSearch] = useState("");
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null | undefined>(undefined);

  const filtered = contacts.filter(c => {
    const matchType = filter === "all" || c.type === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSave = (contact: Contact) => {
    setContacts(cs => {
      const idx = cs.findIndex(c => c.id === contact.id);
      if (idx >= 0) return cs.map(c => c.id === contact.id ? contact : c);
      return [...cs, contact];
    });
  };

  const counts: Record<string, number> = {
    all: contacts.length,
    client: contacts.filter(c => c.type === "client").length,
    prospect: contacts.filter(c => c.type === "prospect").length,
    fournisseur: contacts.filter(c => c.type === "fournisseur").length,
    partenaire: contacts.filter(c => c.type === "partenaire").length,
  };

  const filters: { id: ContactType | "all"; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "client", label: "Clients" },
    { id: "prospect", label: "Prospects" },
    { id: "fournisseur", label: "Fournisseurs" },
    { id: "partenaire", label: "Partenaires" },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{contacts.length} contacts au total</p>
        </div>
        <button onClick={() => setEditingContact({})} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-colors" style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Nouveau contact
        </button>
      </div>

      {/* Filters & search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un contact…" className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex items-center gap-1 p-1 bg-card rounded-xl border border-border">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{ background: filter === f.id ? "var(--primary)" : "transparent", color: filter === f.id ? "white" : "var(--muted-foreground)" }}>
              {f.label} <span className="text-xs opacity-75 ml-1">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-card rounded-2xl border border-border">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Nom", "Entreprise", "Email", "Téléphone", "Type", "Dernier contact", "CA", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const ts = TYPE_STYLES[c.type];
              return (
                <tr key={c.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: ts.bg, color: ts.color }}>
                        {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.status === "actif" ? "#10B981" : "#94A3B8" }}></div>
                          <span className="text-xs text-muted-foreground">{c.status}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Building size={12} className="text-muted-foreground" />
                      {c.company}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-sm hover:underline" style={{ color: "var(--primary)" }}>
                      <Mail size={12} />{c.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Phone size={12} className="text-muted-foreground" />
                      {c.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(c.lastContact).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: c.revenue ? "#10B981" : "var(--muted-foreground)" }}>
                    {c.revenue || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingContact(c)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Modifier">
                        <Edit2 size={13} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => setContacts(cs => cs.filter(x => x.id !== c.id))} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">Aucun contact trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingContact !== undefined && (
        <ContactModal contact={editingContact} onClose={() => setEditingContact(undefined)} onSave={handleSave} />
      )}
    </div>
  );
}
