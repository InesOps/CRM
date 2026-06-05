import { useState, useEffect } from "react";
import { Search, Plus, Mail, Phone, Building, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import {
  getNextContactId,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
} from "../../firebase/crud/contacts";

type ContactType   = "client" | "fournisseur" | "partenaire";
type ContactStatus = "actif" | "inactif";

interface Contact {
  id: string;
  contactId: number;
  Name: string;
  Lastname: string;
  Company: string;
  Email: string;
  Phone: string;
  type: ContactType;
  status: ContactStatus;
  lastContact: string;
  tags: string[];
  DealValue?: number;
}

const TYPE_STYLES: Record<ContactType, { label: string; color: string; bg: string }> = {
  client:      { label: "Client",      color: "#2563EB", bg: "#DBEAFE" },
  fournisseur: { label: "Fournisseur", color: "#8B5CF6", bg: "#EDE9FE" },
  partenaire:  { label: "Partenaire",  color: "#10B981", bg: "#D1FAE5" },
};

// ── Modal ─────────────────────────────────────────────────────────────────────
function ContactModal({
  contact, saving, onClose, onSave,
}: {
  contact: Partial<Contact>;
  saving: boolean;
  onClose: () => void;
  onSave: (data: Omit<Contact, "id" | "contactId">) => void;
}) {
  const [Name,        setName]        = useState(contact.Name        ?? "");
  const [Lastname,    setLastname]    = useState(contact.Lastname    ?? "");
  const [Company,     setCompany]     = useState(contact.Company     ?? "");
  const [Email,       setEmail]       = useState(contact.Email       ?? "");
  const [Phone,       setPhone]       = useState(contact.Phone       ?? "");
  const [type,        setType]        = useState<ContactType>(contact.type     ?? "client");
  const [status,      setStatus]      = useState<ContactStatus>(contact.status ?? "actif");
  const [lastContact, setLastContact] = useState(contact.lastContact ?? new Date().toISOString().split("T")[0]);
  const [tagInput,    setTagInput]    = useState("");
  const [tags,        setTags]        = useState<string[]>(contact.tags ?? []);
  const [DealValue,   setDealValue]   = useState(contact.DealValue?.toString() ?? "");

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(ts => [...ts, t]);
    setTagInput("");
  };

  const canSave = Name.trim() && Email.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground">{contact.id ? "Modifier le contact" : "Nouveau contact"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prénom *</label>
            <input value={Name} onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom</label>
            <input value={Lastname} onChange={e => setLastname(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entreprise</label>
            <input value={Company} onChange={e => setCompany(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
            <input value={Phone} onChange={e => setPhone(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email *</label>
            <input type="email" value={Email} onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
            <select value={type} onChange={e => setType(e.target.value as ContactType)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="client">Client</option>
              <option value="fournisseur">Fournisseur</option>
              <option value="partenaire">Partenaire</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value as ContactStatus)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dernier contact</label>
            <input type="date" value={lastContact} onChange={e => setLastContact(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* CA Annuel — clients only */}
          {type === "client" && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CA Annuel (DT)</label>
              <input type="number" value={DealValue} onChange={e => setDealValue(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</label>
            <div className="flex gap-2 mt-1">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={addTag} type="button"
                className="px-3 py-2 rounded-lg text-sm text-white" style={{ background: "var(--primary)" }}>+</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border text-foreground">
                    {t}
                    <button onClick={() => setTags(ts => ts.filter(x => x !== t))} className="text-muted-foreground hover:text-red-400">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({
              Name, Lastname, Company, Email, Phone, type, status, lastContact, tags,
              DealValue: type === "client" && DealValue ? Number(DealValue) : undefined,
            })}
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

// ── Main ──────────────────────────────────────────────────────────────────────
export function Contacts() {
  const [contacts,       setContacts]       = useState<Contact[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [filter,         setFilter]         = useState<ContactType | "all">("all");
  const [search,         setSearch]         = useState("");
  const [editingContact, setEditingContact] = useState<Partial<Contact> | undefined>(undefined);
  const [deleteConfirm,  setDeleteConfirm]  = useState<Contact | null>(null);

  // READ — contacts collection only (no prospects)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getContacts();
        setContacts(snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Contact))
          .sort((a, b) => (a.contactId ?? 0) - (b.contactId ?? 0))
        );
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // CREATE / UPDATE
  const handleSave = async (
    formData: Omit<Contact, "id" | "contactId">,
    existing?: Partial<Contact>
  ) => {
    setSaving(true);

    // Only the fields we want in Firestore
    const payload: any = {
      Name:        formData.Name,
      Lastname:    formData.Lastname,
      Company:     formData.Company,
      Email:       formData.Email,
      Phone:       formData.Phone,
      type:        formData.type,
      status:      formData.status,
      lastContact: formData.lastContact,
      tags:        formData.tags,
    };
    if (formData.type === "client" && formData.DealValue !== undefined) {
      payload.DealValue = formData.DealValue;
    } else {
      // Remove DealValue if type changed away from client
      payload.DealValue = null;
    }

    try {
      if (existing?.id) {
        // UPDATE — strip contactId from the update payload to avoid overwrite bug
        const { contactId, ...fieldsToUpdate } = payload;
        await updateContact(existing.id, fieldsToUpdate);
        setContacts(cs => cs.map(c =>
          c.id === existing.id ? { ...c, ...fieldsToUpdate } : c
        ));
      } else {
        // CREATE
        const newId = await getNextContactId();
        payload.contactId = newId;
        const ref = await addContact(payload);
        setContacts(cs => [...cs, { id: ref.id, ...payload }]
          .sort((a, b) => (a.contactId ?? 0) - (b.contactId ?? 0))
        );
      }
      setEditingContact(undefined);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // DELETE
  const handleDelete = async (contact: Contact) => {
    try {
      await deleteContact(contact.id);
      setContacts(cs => cs.filter(c => c.id !== contact.id));
    } catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const filtered = contacts.filter(c => {
    const matchType   = filter === "all" || c.type === filter;
    const fullName    = `${c.Name} ${c.Lastname}`.toLowerCase();
    const matchSearch = !search ||
      fullName.includes(search.toLowerCase()) ||
      (c.Company ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.Email   ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts: Record<string, number> = {
    all:         contacts.length,
    client:      contacts.filter(c => c.type === "client").length,
    fournisseur: contacts.filter(c => c.type === "fournisseur").length,
    partenaire:  contacts.filter(c => c.type === "partenaire").length,
  };

  const filterTabs: { id: ContactType | "all"; label: string }[] = [
    { id: "all",         label: "Tous" },
    { id: "client",      label: "Clients" },
    { id: "fournisseur", label: "Fournisseurs" },
    { id: "partenaire",  label: "Partenaires" },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{contacts.length} contacts au total</p>
        </div>
        <button onClick={() => setEditingContact({})}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
          style={{ background: "var(--primary)" }}>
          <Plus size={16} /> Nouveau contact
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex items-center gap-1 p-1 bg-card rounded-xl border border-border">
          {filterTabs.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{ background: filter === f.id ? "var(--primary)" : "transparent", color: filter === f.id ? "white" : "var(--muted-foreground)" }}>
              {f.label} <span className="text-xs opacity-75 ml-1">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-card rounded-2xl border border-border">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" /><span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "Nom", "Entreprise", "Email", "Téléphone", "Type", "Dernier contact", "CA", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const ts = TYPE_STYLES[c.type] ?? TYPE_STYLES.client;
                const initials = `${c.Name?.[0] ?? ""}${c.Lastname?.[0] ?? ""}`.toUpperCase() || "?";
                return (
                  <tr key={c.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.contactId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: ts.bg, color: ts.color }}>{initials}</div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{c.Name} {c.Lastname}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.status === "actif" ? "#10B981" : "#94A3B8" }} />
                            <span className="text-xs text-muted-foreground">{c.status}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <Building size={12} className="text-muted-foreground" />{c.Company || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${c.Email}`} className="flex items-center gap-1.5 text-sm hover:underline" style={{ color: "var(--primary)" }}>
                        <Mail size={12} />{c.Email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone size={12} />{c.Phone || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {c.lastContact ? new Date(c.lastContact).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: c.DealValue ? "#10B981" : "var(--muted-foreground)" }}>
                      {c.DealValue ? `${Number(c.DealValue).toLocaleString("fr-FR")} DT` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingContact(c)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Edit2 size={13} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteConfirm(c)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={13} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">Aucun contact trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingContact !== undefined && (
        <ContactModal contact={editingContact} saving={saving}
          onClose={() => setEditingContact(undefined)}
          onSave={(data) => handleSave(data, editingContact)} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-foreground mb-2">Supprimer le contact</h2>
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