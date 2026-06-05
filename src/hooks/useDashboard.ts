import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Juil","Aoû","Sep","Oct","Nov","Déc"];

export const useDashboard = () => {
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
        const lateTasks       = tasks.filter(t =>
          (t as any).column !== "done" &&
          (t as any).dueDate &&
          (t as any).dueDate < today
        ).length;

        // ── Revenue by month (from contacts createdAt) ────────────────────────
        const monthTotals: Record<number, number> = {};
        contacts.forEach(c => {
          const deal = Number((c as any).DealValue) || 0;
          if (!deal) return;
          const createdAt = (c as any).createdAt;
          let monthIdx = new Date().getMonth(); // fallback to current month
          if (createdAt?.toDate) {
            monthIdx = createdAt.toDate().getMonth();
          } else if (typeof createdAt === "string") {
            monthIdx = new Date(createdAt).getMonth();
          }
          monthTotals[monthIdx] = (monthTotals[monthIdx] ?? 0) + deal;
        });
        const revenueByMonth = Object.entries(monthTotals)
          .map(([m, revenue]) => ({ month: MONTHS_FR[Number(m)], revenue, monthIdx: Number(m) }))
          .sort((a, b) => a.monthIdx - b.monthIdx)
          .map(({ month, revenue }) => ({ month, revenue }));

        // ── Pipeline bar chart ────────────────────────────────────────────────
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
          if (!stage) return;                  // skip missing
          const label = stageLabels[stage];
          if (!label) return;                  // skip unknown values
          stageCounts[label] = (stageCounts[label] ?? 0) + 1;
        });
        const pipelineByStage = Object.entries(stageCounts).map(([stage, value]) => ({ stage, value }));

        // ── Contacts pie chart ────────────────────────────────────────────────
        const typeCounts: Record<string, number> = {};
        contacts.forEach(c => {
          const type = (c as any).type;
          if (!type) return;
          typeCounts[type] = (typeCounts[type] ?? 0) + 1;
        });
        const typeLabels: Record<string, string> = {
          client:      "Clients actifs",
          fournisseur: "Fournisseurs",
          partenaire:  "Partenaires",
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
};