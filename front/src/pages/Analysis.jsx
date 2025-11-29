import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, RefreshCcw, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";
import KPICards from "@/components/analysis/KPICards";
import LineChartCard from "@/components/analysis/LineChartCard";
import DonutChartCard from "@/components/analysis/DonutChartCard";
import CategoriesTable from "@/components/analysis/CategoriesTable";
import MonthlyFormModal from "@/components/analysis/MonthlyFormModal";
import { safeAction } from "@/components/analysis/SafeAction";
import { enqueueOperation, flushQueue, getQueue } from "@/components/analysis/offlineQueue";

export default function AnalysisPage() {
  const [months, setMonths] = React.useState([]);
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [currentMonthly, setCurrentMonthly] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [openModal, setOpenModal] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [importing, setImporting] = React.useState(false);

  const fileRef = React.useRef(null);

  /*React.useEffect(() => {
    loadAll();
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);*/

  /*React.useEffect(() => {
    if (selectedMonth) {
      loadForMonth(selectedMonth);
    }
  }, [selectedMonth]);*/

  /*const loadAll = async () => {
    const list = await AnalysisMonthly.list();
    const sorted = [...list].sort((a, b) => (a.month < b.month ? 1 : -1));
    setMonths(sorted);
    if (!selectedMonth && sorted.length > 0) setSelectedMonth(sorted[0].month);
  };*/

  /*const loadForMonth = async (month) => {
    const monthly = (await AnalysisMonthly.filter({ month }))[0];
    setCurrentMonthly(monthly || null);
    const cats = await AnalysisCategory.filter({ analysis_month: month });
    setCategories(cats);
  };*/

  const formatXOF = (n) => `${new Intl.NumberFormat("fr-FR").format(Number(n || 0))} XOF`;

  const recalcPercents = async (month, monthlyData, cats) => {
    /*const revTotal = Number(monthlyData?.revenue_total || 0);
    const expTotal = Number(monthlyData?.expense_total || 0);
    for (const c of cats) {
      const parent = c.kind === "depense" ? expTotal : revTotal;
      const percent = parent > 0 ? (Number(c.amount || 0) / parent) * 100 : 0;
      if (Math.abs((c.percent_of_parent || 0) - percent) > 0.05) {
        await AnalysisCategory.update(c.id, { percent_of_parent: percent });
      }
    }*/
  };

  const recalcMonthlyFromCategories = async (month, monthlyData) => {
    /*const cats = await AnalysisCategory.filter({ analysis_month: month });
    const totalDep = cats.filter(c => c.kind === "depense").reduce((s, c) => s + Number(c.amount || 0), 0);
    const totalRev = cats.filter(c => c.kind === "revenu").reduce((s, c) => s + Number(c.amount || 0), 0);
    const savings = totalRev - totalDep;
    await AnalysisMonthly.update(monthlyData.id, {
      expense_total: totalDep,
      revenue_total: totalRev,
      savings_total: savings
    });
    await recalcPercents(month, { expense_total: totalDep, revenue_total: totalRev }, cats);
    await loadForMonth(month);
    await loadAll();*/
  };

  const handleCreateMonthly = safeAction(async (payload) => {
    /*if (isOffline) {
      enqueueOperation({ entity: "AnalysisMonthly", action: "create", payload });
      const optimistic = { ...payload, id: `tmp-${Date.now()}` };
      setMonths(prev => [optimistic, ...prev]);
      setSelectedMonth(payload.month);
      setCurrentMonthly(optimistic);
      return;
    }
    await AnalysisMonthly.create(payload);
    await loadAll();
    setSelectedMonth(payload.month);*/
  }, { onSuccess: () => {/* noop */} });

  const handleUpdateMonthly = safeAction(async (id, payload) => {
    /*const toSave = { ...payload, savings_total: Number(payload.revenue_total || 0) - Number(payload.expense_total || 0) };
    if (isOffline) {
      enqueueOperation({ entity: "AnalysisMonthly", action: "update", payload: { id, data: toSave } });
      setCurrentMonthly(prev => ({ ...prev, ...toSave }));
      await loadAll();
      return;
    }
    await AnalysisMonthly.update(id, toSave);
    await loadForMonth(payload.month || selectedMonth);
    await loadAll();*/
  });

  const createCategory = safeAction(async (payload) => {
    /*if (isOffline) {
      enqueueOperation({ entity: "AnalysisCategory", action: "create", payload });
      setCategories(prev => [{ ...payload, id: `tmp-${Date.now()}`, percent_of_parent: 0 }, ...prev]);
      return;
    }
    await AnalysisCategory.create(payload);
    await loadForMonth(payload.analysis_month);
    if (currentMonthly?.driven_by_categories) await recalcMonthlyFromCategories(payload.analysis_month, currentMonthly);
    else await recalcPercents(payload.analysis_month, currentMonthly, await AnalysisCategory.filter({ analysis_month: payload.analysis_month }));*/
  });

  const updateCategory = safeAction(async (item, payload) => {
    /*/if (isOffline) {
      enqueueOperation({ entity: "AnalysisCategory", action: "update", payload: { id: item.id, data: payload } });
      setCategories(prev => prev.map(c => c.id === item.id ? { ...c, ...payload } : c));
      return;
    }
    await AnalysisCategory.update(item.id, payload);
    await loadForMonth(payload.analysis_month);
    if (currentMonthly?.driven_by_categories) await recalcMonthlyFromCategories(payload.analysis_month, currentMonthly);
    else await recalcPercents(payload.analysis_month, currentMonthly, await AnalysisCategory.filter({ analysis_month: payload.analysis_month }));*/
  });

  const deleteCategory = safeAction(async (item) => {
    /*if (isOffline) {
      enqueueOperation({ entity: "AnalysisCategory", action: "delete", payload: { id: item.id } });
      setCategories(prev => prev.filter(c => c.id !== item.id));
      return;
    }
    await AnalysisCategory.delete(item.id);
    await loadForMonth(selectedMonth);
    if (currentMonthly?.driven_by_categories) await recalcMonthlyFromCategories(selectedMonth, currentMonthly);
    else await recalcPercents(selectedMonth, currentMonthly, await AnalysisCategory.filter({ analysis_month: selectedMonth }));*/
  });

  const exportCSV = () => {
    const rows = [
      ["category_name", "kind", "amount", "notes"],
      ...(categories || []).map(c => [c.category_name, c.kind, String(c.amount || 0), (c.notes || "").replace(/[\n\r]+/g, " ")])
    ];
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async (file) => {
    setImporting(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) { setImporting(false); return; }
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    const idxName = headers.indexOf("category_name");
    const idxKind = headers.indexOf("kind");
    const idxAmount = headers.indexOf("amount");
    const idxNotes = headers.indexOf("notes");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/("([^"]|"")*"|[^,]+)/g).map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
      const payload = {
        analysis_month: selectedMonth,
        category_name: cols[idxName],
        kind: cols[idxKind],
        amount: Number(cols[idxAmount] || 0),
        notes: cols[idxNotes] || ""
      };
      await createCategory(payload);
    }
    setImporting(false);
  };

  const flushIfOnline = async () => {
    /*if (!isOffline) {
      await flushQueue({
        AnalysisMonthly: {
          create: (p) => AnalysisMonthly.create(p),
          update: ({ id, data }) => AnalysisMonthly.update(id, data)
        },
        AnalysisCategory: {
          create: (p) => AnalysisCategory.create(p),
          update: ({ id, data }) => AnalysisCategory.update(id, data),
          delete: ({ id }) => AnalysisCategory.delete(id)
        }
      });
      if (selectedMonth) await loadForMonth(selectedMonth);
      await loadAll();
    }*/
  };

  /*React.useEffect(() => {
    if (!isOffline) {
      flushIfOnline();
    }
  }, [isOffline]);*/

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analysis</h1>
            <p className="text-neutral-600 text-sm">Suivi des revenus, dépenses et économies par mois</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (<SelectItem key={m.id} value={m.month}>{m.month}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button onClick={() => setOpenModal(true)}>Nouveau mois</Button>
            <Button variant="outline" onClick={flushIfOnline} title="Synchroniser">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isOffline && (
          <Card className="border border-orange-200 bg-orange-50">
            <CardContent className="p-3 text-sm text-orange-800">
              Hors ligne — vos modifications seront synchronisées automatiquement à la reconnexion. En file: {getQueue().length}
            </CardContent>
          </Card>
        )}

        <KPICards data={currentMonthly || {}} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartCard series={months} />
          <DonutChartCard categories={categories} totals={{ revenue_total: currentMonthly?.revenue_total, expense_total: currentMonthly?.expense_total }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-600">
            <PieChartIcon className="w-4 h-4" />
            <span className="text-sm">Mois sélectionné: <strong>{selectedMonth || "—"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!selectedMonth || importing}>
              <Upload className="w-4 h-4 mr-2" /> Importer CSV
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={!(categories && categories.length)}>
              <Download className="w-4 h-4 mr-2" /> Exporter CSV
            </Button>
          </div>
        </div>

        <CategoriesTable
          items={categories}
          month={selectedMonth}
          onCreate={createCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />

        <MonthlyFormModal
          open={openModal}
          onOpenChange={setOpenModal}
          onSubmit={async (payload) => {
            const exists = months.find(m => m.month === payload.month);
            if (exists) {
              await handleUpdateMonthly(exists.id, payload);
            } else {
              await handleCreateMonthly(payload);
            }
            setOpenModal(false);
          }}
        />
      </div>
    </div>
  );
}