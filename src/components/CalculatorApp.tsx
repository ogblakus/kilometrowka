"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@clerk/nextjs";
import CloudSyncBanners from "@/components/CloudSyncBanners";
import Disclaimer from "@/components/Disclaimer";
import DietaPremiumGate from "@/components/DietaPremiumGate";
import ExportButtons from "@/components/ExportButtons";
import MonthlyTotals from "@/components/MonthlyTotals";
import PaywallModal from "@/components/PaywallModal";
import PremiumUnlock from "@/components/PremiumUnlock";
import Toast from "@/components/Toast";
import TripForm from "@/components/TripForm";
import KalkulatorHeader from "@/components/KalkulatorHeader";
import TripList from "@/components/TripList";
import {
  deleteCloudTrip,
  fetchCloudMe,
  fetchCloudTrips,
  patchCloudTrip,
  postCloudTrip,
} from "@/lib/cloudTrips";
import { formatMonthLabel } from "@/lib/format";
import {
  canAddTrip,
  canExportExcel,
  canUseDieta,
  clearLocalPlan,
  countTripsInMonth,
  currentMonthKey,
  isWithinFreeQuota,
  type Plan,
} from "@/lib/plan";
import { loadTrips, saveTrips } from "@/lib/storage";
import type { Trip } from "@/lib/types";

const IMPORT_FLAG = "kilometrowka.app.import.offered.v1";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CalculatorApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);
  const [cloudMode, setCloudMode] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  // Signed-in: plan comes only from GET /api/me (Neon). Guests: always Free.
  const [plan, setPlan] = useState<Plan>("free");
  // Signed-in Free quota usage (trips CREATED this Warsaw month, from server)
  const [cloudTripsThisMonth, setCloudTripsThisMonth] = useState<
    number | null
  >(null);
  const [monthFilter, setMonthFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<"trips" | "excel" | "dieta" | null>(
    null,
  );
  const [importOffer, setImportOffer] = useState<Trip[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const skipLocalSave = useRef(false);

  const refreshPlanFromCloud = useCallback(async () => {
    const me = await fetchCloudMe();
    if (me) {
      setPlan(me.plan);
      setCloudTripsThisMonth(me.tripsThisMonth);
    } else {
      setPlan("free");
    }
  }, []);

  const loadCloudTrips = useCallback(async () => {
    setSyncing(true);
    try {
      const list = await fetchCloudTrips();
      if (list === null) {
        setToast("Nie udało się wczytać danych z chmury — odśwież stronę.");
        return;
      }
      setTrips(list);
      setCloudMode(true);
      skipLocalSave.current = true;
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      void (async () => {
        await refreshPlanFromCloud();
        await loadCloudTrips();
        const local = loadTrips();
        const offered =
          typeof window !== "undefined" &&
          localStorage.getItem(IMPORT_FLAG) === "1";
        if (local.length > 0 && !offered) setImportOffer(local);
        setReady(true);
      })();
    } else {
      // Guest: always Free. Premium requires an account (purchase needs sign-in).
      setCloudMode(false);
      setTrips(loadTrips());
      clearLocalPlan();
      setPlan("free");
      setCloudTripsThisMonth(null);
      setImportOffer(null);
      setReady(true);
    }
  }, [isLoaded, isSignedIn, loadCloudTrips, refreshPlanFromCloud]);

  useEffect(() => {
    if (!ready) return;
    if (cloudMode || isSignedIn) return;
    if (skipLocalSave.current) {
      skipLocalSave.current = false;
      return;
    }
    saveTrips(trips);
  }, [trips, ready, cloudMode, isSignedIn]);

  const monthOptions = useMemo(() => {
    const keys = new Set(trips.map((t) => t.date.slice(0, 7)));
    keys.add(currentMonthKey());
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [trips]);

  const filteredTrips = monthFilter
    ? trips.filter((t) => t.date.startsWith(monthFilter))
    : trips;

  const tripsThisMonth =
    cloudMode && isSignedIn && cloudTripsThisMonth !== null
      ? cloudTripsThisMonth
      : countTripsInMonth(trips, currentMonthKey());
  const addBlocked = !isWithinFreeQuota(plan, tripsThisMonth);
  const excelOk = canExportExcel(plan);
  const dietaOk = canUseDieta(plan);

  async function handleSave(data: Omit<Trip, "id"> & { id?: string }) {
    if (data.id) {
      if (cloudMode && isSignedIn) {
        const trip = await patchCloudTrip(data.id, data);
        if (!trip) {
          setToast("Błąd zapisu w chmurze.");
          return;
        }
        setTrips((prev) => prev.map((t) => (t.id === data.id ? trip : t)));
        setEditing(null);
        setToast("Zapisano zmiany (chmura).");
        return;
      }
      setTrips((prev) =>
        prev.map((t) => (t.id === data.id ? ({ ...t, ...data } as Trip) : t)),
      );
      setEditing(null);
      setToast("Zapisano zmiany.");
      return;
    }

    if (cloudMode && isSignedIn) {
      if (!isWithinFreeQuota(plan, tripsThisMonth)) {
        setPaywall("trips");
        return;
      }
      const res = await postCloudTrip(data);
      if (!res.ok) {
        if (res.code === "TRIP_QUOTA") {
          setPaywall("trips");
          void refreshPlanFromCloud();
          return;
        }
        setToast(res.error || "Błąd zapisu w chmurze.");
        return;
      }
      setTrips((prev) => [res.trip, ...prev]);
      setCloudTripsThisMonth((n) => (n === null ? n : n + 1));
      setToast("Dodano przejazd (chmura).");
      return;
    }

    if (!canAddTrip(plan, trips)) {
      setPaywall("trips");
      return;
    }

    const trip: Trip = {
      id: newId(),
      date: data.date,
      from: data.from,
      to: data.to,
      km: data.km,
      purpose: data.purpose,
      vehicle: data.vehicle,
      amount: data.amount,
    };
    setTrips((prev) => [trip, ...prev]);
    setToast("Dodano przejazd.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Usunąć ten przejazd?")) return;
    if (cloudMode && isSignedIn) {
      const ok = await deleteCloudTrip(id);
      if (!ok) {
        setToast("Błąd usuwania w chmurze.");
        return;
      }
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (editing?.id === id) setEditing(null);
      void refreshPlanFromCloud();
      setToast("Usunięto przejazd (chmura).");
      return;
    }
    setTrips((prev) => prev.filter((t) => t.id !== id));
    if (editing?.id === id) setEditing(null);
    setToast("Usunięto przejazd.");
  }

  async function importLocalTrips() {
    if (!importOffer?.length) return;
    setSyncing(true);
    try {
      let imported = 0;
      let quotaHit = false;
      for (const t of importOffer) {
        const res = await postCloudTrip(t);
        if (res.ok) imported++;
        else if (res.code === "TRIP_QUOTA") {
          quotaHit = true;
          break;
        }
      }
      localStorage.setItem(IMPORT_FLAG, "1");
      setImportOffer(null);
      await loadCloudTrips();
      await refreshPlanFromCloud();
      setToast(
        quotaHit
          ? `Zaimportowano ${imported} z ${importOffer.length} przejazd(ów) — osiągnięto limit Free w tym miesiącu.`
          : `Zaimportowano ${imported} przejazd(ów) z tej przeglądarki.`,
      );
      if (quotaHit) setPaywall("trips");
    } catch {
      setToast("Częściowy błąd importu — odśwież listę.");
    } finally {
      setSyncing(false);
    }
  }

  function dismissImport() {
    localStorage.setItem(IMPORT_FLAG, "1");
    setImportOffer(null);
  }

  if (!isLoaded || !ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-slate-500">
        Ładowanie ewidencji…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
      <Suspense fallback={null}>
        <PremiumUnlock />
      </Suspense>

      <CloudSyncBanners
        isSignedIn={isSignedIn}
        cloudMode={cloudMode}
        syncing={syncing}
        importOffer={importOffer}
        onImport={() => void importLocalTrips()}
        onDismissImport={dismissImport}
      />

      <KalkulatorHeader
        plan={plan}
        tripsThisMonth={tripsThisMonth}
        cloudMode={cloudMode}
      />

      <Disclaimer compact />

      <TripForm
        initial={editing}
        onSave={(t) => void handleSave(t)}
        onCancel={editing ? () => setEditing(null) : undefined}
        disabled={addBlocked && !editing}
        onBlocked={() => setPaywall("trips")}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Lista przejazdów
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only sm:not-sr-only">Miesiąc</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Filtr miesiąca"
            >
              <option value="">Wszystkie</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ExportButtons
          trips={filteredTrips}
          canExcel={excelOk && cloudMode && !!isSignedIn}
          monthKey={monthFilter}
          onExcelBlocked={() => setPaywall("excel")}
          onError={setToast}
        />
      </div>

      <TripList
        trips={trips}
        monthFilter={monthFilter}
        onEdit={setEditing}
        onDelete={(id) => void handleDelete(id)}
      />

      <MonthlyTotals trips={filteredTrips} />

      <DietaPremiumGate
        unlocked={dietaOk}
        onMoreInfo={() => setPaywall("dieta")}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {paywall && (
        <PaywallModal reason={paywall} onClose={() => setPaywall(null)} />
      )}
    </div>
  );
}
