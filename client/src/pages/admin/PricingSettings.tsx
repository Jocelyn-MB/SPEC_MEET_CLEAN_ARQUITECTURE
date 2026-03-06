import React, { useState } from "react";
import {
  PlusIcon, TrashIcon, SearchIcon, PackageIcon, DollarSignIcon,
  PencilIcon, XIcon, FilterIcon, ToggleLeftIcon, ToggleRightIcon,
  ArchiveIcon, AlertTriangleIcon, ChevronDownIcon, ClockIcon,
} from "lucide-react";

// ─── TYPES ──────────────────────────────────────────────────────────────────

type BillingUnit = "hour" | "half_day" | "full_day" | "flat" | "custom";

interface ScheduleOption {
  label: string;
  startTime: string;
  endTime: string;
}

interface PricePackage {
  id: string;
  name: string;
  description: string | null;
  billingUnit: BillingUnit;
  minDuration: number | null;
  maxDuration: number | null;
  metadata: Record<string, any>;
  roomId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface RoomBaseRate {
  id: string;
  roomId: string;
  hourlyRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const BILLING_LABELS: Record<BillingUnit, string> = {
  hour: "Por Hora", half_day: "Medio Día", full_day: "Día Completo", flat: "Tarifa Fija", custom: "Personalizado",
};

const BILLING_STYLES: Record<BillingUnit, string> = {
  hour: "bg-blue-50 text-blue-700 border-blue-200",
  half_day: "bg-emerald-50 text-emerald-700 border-emerald-200",
  full_day: "bg-amber-50 text-amber-700 border-amber-200",
  flat: "bg-purple-50 text-purple-700 border-purple-200",
  custom: "bg-rose-50 text-rose-700 border-rose-200",
};

const SCHEDULE_DOT_COLORS = ["bg-amber-400", "bg-violet-500", "bg-emerald-500", "bg-rose-400", "bg-blue-500"];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

const fmtTime = (t: string) => {
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12.toString().padStart(2, "0")}:${m} ${ampm}`;
};

const computePrice = (rate: number, discPct: number, hours: number) => {
  const eff = rate * (1 - discPct / 100);
  return { effective: Math.round(eff * 100) / 100, total: Math.round(eff * hours * 100) / 100 };
};

const getActiveRate = (roomId: string | null, rates: RoomBaseRate[]): number => {
  if (!roomId) return 0;
  return rates.find((r) => r.roomId === roomId && !r.effectiveUntil)?.hourlyRate ?? 0;
};

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const MOCK_ROOMS: Room[] = [
  { id: "r1", name: "Sala Focus" },
  { id: "r2", name: "Sala Ejecutiva" },
  { id: "r3", name: "Sala Magna" },
];

const INITIAL_PACKAGES: PricePackage[] = [
  {
    id: "p1", name: "Renta por Hora",
    description: "Tarifa base sin descuentos. Reserva el tiempo que necesites.",
    billingUnit: "hour", minDuration: 60, maxDuration: 660,
    metadata: {},  // ← NO discount, NO schedule for hourly
    roomId: "r1", isActive: true, createdAt: "2025-02-01",
  },
  {
    id: "p2", name: "Plan Medio Día",
    description: "Bloque de 5.5 horas con 30% de descuento. Elige turno mañana o tarde.",
    billingUnit: "half_day", minDuration: 330, maxDuration: 330,
    metadata: {
      discountPct: 30, blockHours: 5.5, bulkEligible: true,
      schedule: {
        type: "fixed_blocks",
        options: [
          { label: "Mañana", startTime: "08:00", endTime: "13:30" },
          { label: "Tarde", startTime: "14:30", endTime: "20:00" },
        ],
      },
    },
    roomId: "r1", isActive: true, createdAt: "2025-02-01",
  },
  {
    id: "p3", name: "Plan Día Completo",
    description: "Jornada completa de 12 horas con 40% de descuento.",
    billingUnit: "full_day", minDuration: 720, maxDuration: 720,
    metadata: {
      discountPct: 40, blockHours: 12, bulkEligible: true,
      schedule: {
        type: "fixed_blocks",
        options: [
          { label: "Día Completo", startTime: "08:00", endTime: "20:00" },
        ],
      },
    },
    roomId: "r1", isActive: true, createdAt: "2025-02-01",
  },
  {
    id: "p4", name: "Cliente Frecuente",
    description: "5+ bloques con 10% adicional. Prepago 30 días.",
    billingUnit: "custom", minDuration: 330, maxDuration: null,
    metadata: { programType: "bulk_purchase", additionalDiscountPct: 10, minBlocks: 5 },
    roomId: null, isActive: true, createdAt: "2025-06-01",
  },
];

const INITIAL_RATES: RoomBaseRate[] = [
  { id: "rate1", roomId: "r1", hourlyRate: 400, currency: "MXN", effectiveFrom: "2025-01-01", effectiveUntil: null, createdAt: "2025-01-01" },
  { id: "rate-old", roomId: "r1", hourlyRate: 350, currency: "MXN", effectiveFrom: "2024-06-01", effectiveUntil: "2024-12-31", createdAt: "2024-06-01" },
  { id: "rate2", roomId: "r2", hourlyRate: 600, currency: "MXN", effectiveFrom: "2025-01-01", effectiveUntil: null, createdAt: "2025-01-01" },
  { id: "rate3", roomId: "r3", hourlyRate: 1200, currency: "MXN", effectiveFrom: "2025-01-01", effectiveUntil: null, createdAt: "2025-01-01" },
];

// ─── FORM TYPES ─────────────────────────────────────────────────────────────

interface PkgFormData {
  name: string;
  description: string;
  billingUnit: BillingUnit;
  minDuration: string;
  maxDuration: string;
  discountPct: string;
  blockHours: string;
  roomId: string;
  isActive: boolean;
  bulkEligible: boolean;
  scheduleOptions: ScheduleOption[];
}

const EMPTY_FORM: PkgFormData = {
  name: "", description: "", billingUnit: "hour",
  minDuration: "60", maxDuration: "", discountPct: "0", blockHours: "",
  roomId: "", isActive: true, bulkEligible: false, scheduleOptions: [],
};

const toFormData = (p: PricePackage): PkgFormData => ({
  name: p.name,
  description: p.description || "",
  billingUnit: p.billingUnit,
  minDuration: p.minDuration?.toString() || "",
  maxDuration: p.maxDuration?.toString() || "",
  discountPct: (p.metadata.discountPct ?? 0).toString(),
  blockHours: (p.metadata.blockHours ?? "").toString(),
  roomId: p.roomId || "",
  isActive: p.isActive,
  bulkEligible: p.metadata.bulkEligible ?? false,
  scheduleOptions: p.metadata.schedule?.options || [],
});

// Determine if billing type needs schedule/discount fields
const needsSchedule = (bu: BillingUnit) => bu === "half_day" || bu === "full_day" || bu === "flat";
const needsDiscount = (bu: BillingUnit) => bu !== "hour" && bu !== "custom";

// ─── STYLE HELPERS ──────────────────────────────────────────────────────────

const inputClass = "w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors";
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PricingSettings: React.FC = () => {
  const [packages, setPackages] = useState<PricePackage[]>(INITIAL_PACKAGES);
  const [rates, setRates] = useState<RoomBaseRate[]>(INITIAL_RATES);
  const [rooms] = useState<Room[]>(MOCK_ROOMS);

  const [subTab, setSubTab] = useState<"packages" | "rates">("packages");
  const [search, setSearch] = useState("");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterBilling, setFilterBilling] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PricePackage | null>(null);
  const [pkgForm, setPkgForm] = useState<PkgFormData>(EMPTY_FORM);
  const [deletingPkg, setDeletingPkg] = useState<PricePackage | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateRoomId, setRateRoomId] = useState("");
  const [rateValue, setRateValue] = useState("");

  // ─── HANDLERS ─────────────────────────────────────────────────────────

  const openCreate = () => { setPkgForm(EMPTY_FORM); setEditingPkg(null); setShowPkgModal(true); };

  const openEdit = (pkg: PricePackage) => { setPkgForm(toFormData(pkg)); setEditingPkg(pkg); setShowPkgModal(true); };

  const closeModal = () => { setShowPkgModal(false); setEditingPkg(null); };

  const setField = (key: keyof PkgFormData, val: any) => setPkgForm((f) => ({ ...f, [key]: val }));

  // ─── BUILD METADATA based on billingUnit ──────────────────────────────

  const buildMetadata = (form: PkgFormData): Record<string, any> => {
    // Hourly: NO metadata for discount or schedule
    if (form.billingUnit === "hour") {
      return {};
    }

    // Custom (like Cliente Frecuente): keep whatever custom fields
    if (form.billingUnit === "custom") {
      return editingPkg?.metadata || {};
    }

    // half_day, full_day, flat: discount + schedule
    const meta: Record<string, any> = {
      discountPct: parseFloat(form.discountPct) || 0,
    };

    if (form.blockHours) {
      meta.blockHours = parseFloat(form.blockHours);
    }

    if (form.bulkEligible) {
      meta.bulkEligible = true;
    }

    // Schedule: only if there are options
    if (form.scheduleOptions.length > 0) {
      meta.schedule = {
        type: "fixed_blocks",
        options: form.scheduleOptions,
      };
    }

    return meta;
  };

  const savePkg = () => {
    const now = new Date().toISOString();
    const built: PricePackage = {
      id: editingPkg?.id || `p-${Date.now()}`,
      name: pkgForm.name,
      description: pkgForm.description || null,
      billingUnit: pkgForm.billingUnit,
      minDuration: pkgForm.minDuration ? parseInt(pkgForm.minDuration) : null,
      maxDuration: pkgForm.maxDuration ? parseInt(pkgForm.maxDuration) : null,
      metadata: buildMetadata(pkgForm),
      roomId: pkgForm.roomId || null,
      isActive: pkgForm.isActive,
      createdAt: editingPkg?.createdAt || now,
    };
    if (editingPkg) {
      setPackages((prev) => prev.map((p) => (p.id === editingPkg.id ? built : p)));
    } else {
      setPackages((prev) => [...prev, built]);
    }
    closeModal();
  };

  const deletePkg = () => { if (deletingPkg) { setPackages((prev) => prev.filter((p) => p.id !== deletingPkg.id)); setDeletingPkg(null); } };

  const toggleActive = (id: string) => { setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))); };

  const saveRate = () => {
    if (!rateRoomId || !rateValue) return;
    const now = new Date().toISOString();
    setRates((prev) => prev.map((r) => (r.roomId === rateRoomId && !r.effectiveUntil ? { ...r, effectiveUntil: now } : r)));
    setRates((prev) => [...prev, { id: `rate-${Date.now()}`, roomId: rateRoomId, hourlyRate: parseFloat(rateValue), currency: "MXN", effectiveFrom: now, effectiveUntil: null, createdAt: now }]);
    setShowRateModal(false); setRateRoomId(""); setRateValue("");
  };

  // ─── SCHEDULE OPTION HELPERS ──────────────────────────────────────────

  const addScheduleOption = () => {
    setPkgForm((f) => ({
      ...f,
      scheduleOptions: [...f.scheduleOptions, { label: "", startTime: "08:00", endTime: "13:30" }],
    }));
  };

  const updateScheduleOption = (index: number, field: keyof ScheduleOption, value: string) => {
    setPkgForm((f) => ({
      ...f,
      scheduleOptions: f.scheduleOptions.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    }));
  };

  const removeScheduleOption = (index: number) => {
    setPkgForm((f) => ({
      ...f,
      scheduleOptions: f.scheduleOptions.filter((_, i) => i !== index),
    }));
  };

  // ─── FILTERING ────────────────────────────────────────────────────────

  const filtered = packages.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchRoom = filterRoom === "all" || (filterRoom === "global" ? p.roomId === null : p.roomId === filterRoom);
    const matchBilling = filterBilling === "all" || p.billingUnit === filterBilling;
    return matchSearch && matchRoom && matchBilling;
  });

  const getRoomName = (id: string | null) => (id ? rooms.find((r) => r.id === id)?.name || id : "Todas las salas");

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-0 pb-10">
      {/* ─── TITLE + HORIZONTAL TABS ─── */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Precios y Paquetes</h2>
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 -mb-px">
            <button onClick={() => setSubTab("packages")} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === "packages" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <PackageIcon className="h-4 w-4" /> Paquetes
              <span className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${subTab === "packages" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{packages.length}</span>
            </button>
            <button onClick={() => setSubTab("rates")} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === "rates" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <DollarSignIcon className="h-4 w-4" /> Tarifa Base
              <span className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${subTab === "rates" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{rooms.length}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* ═══════════ PACKAGES TAB ═══════════ */}
      {subTab === "packages" && (
        <>
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
            <div className="flex items-center">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors shrink-0">
                <FilterIcon className="h-3.5 w-3.5" /> Filtros <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
              <div className="flex items-center flex-1 px-3">
                <SearchIcon className="h-4 w-4 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paquetes..." className="w-full bg-transparent border-none px-2 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none" />
              </div>
              <div className="pr-2">
                <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors">
                  <PlusIcon className="h-4 w-4" /> Nuevo
                </button>
              </div>
            </div>
            {showFilters && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50 flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sala</label>
                  <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                    <option value="all">Todas</option>
                    {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    <option value="global">🌐 Globales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                  <select value={filterBilling} onChange={(e) => setFilterBilling(e.target.value)} className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                    <option value="all">Todos</option>
                    {Object.entries(BILLING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                {(filterRoom !== "all" || filterBilling !== "all" || search) && (
                  <button onClick={() => { setFilterRoom("all"); setFilterBilling("all"); setSearch(""); }} className="self-end text-xs text-purple-600 hover:text-purple-800 font-medium py-1.5">Limpiar filtros</button>
                )}
              </div>
            )}
          </div>

          {/* Package List */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg py-16 text-center">
              <PackageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No se encontraron paquetes</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
              {filtered.map((pkg) => {
                const rate = getActiveRate(pkg.roomId, rates);
                const disc = pkg.metadata.discountPct ?? 0;
                const hrs = pkg.metadata.blockHours ?? 1;
                const price = computePrice(rate, disc, pkg.billingUnit === "hour" ? 1 : hrs);
                const schedOpts: ScheduleOption[] = pkg.metadata.schedule?.options || [];

                return (
                  <div key={pkg.id} className={`px-4 py-3.5 hover:bg-gray-50/80 transition-colors ${!pkg.isActive ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-4">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 truncate">{pkg.name}</span>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${BILLING_STYLES[pkg.billingUnit]}`}>{BILLING_LABELS[pkg.billingUnit]}</span>
                          {!pkg.isActive && <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500 border border-gray-200">Inactivo</span>}
                          {pkg.metadata.bulkEligible && <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Elegible freq.</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>📍 {getRoomName(pkg.roomId)}</span>
                          {pkg.minDuration && <span>⏱ Min: {pkg.minDuration}min</span>}
                          {pkg.metadata.blockHours && <span>📐 {pkg.metadata.blockHours}h bloque</span>}
                          {pkg.description && <span className="truncate max-w-xs">— {pkg.description}</span>}
                        </div>
                      </div>

                      {/* Center: Price */}
                      <div className="text-right shrink-0 w-36">
                        {rate > 0 && pkg.billingUnit !== "custom" ? (
                          <>
                            <div className="text-base font-bold text-gray-900">{fmt(pkg.billingUnit === "hour" ? rate : price.total)}</div>
                            {disc > 0 && <div className="text-[11px] text-emerald-600 font-medium">-{disc}% · {fmt(price.effective)}/hr</div>}
                            {pkg.billingUnit === "hour" && <div className="text-[11px] text-gray-400">Tarifa base</div>}
                          </>
                        ) : pkg.billingUnit === "custom" ? (
                          <span className="text-xs text-gray-400 italic">Programa especial</span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin tarifa</span>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleActive(pkg.id)} title={pkg.isActive ? "Desactivar" : "Activar"} className="p-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                          {pkg.isActive ? <ToggleRightIcon className="h-4 w-4 text-purple-600" /> : <ToggleLeftIcon className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(pkg)} title="Editar" className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingPkg(pkg)} title="Eliminar" className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Schedule Blocks (shown inline below the row) */}
                    {schedOpts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2.5 ml-0">
                        {schedOpts.map((opt, i) => (
                          <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${SCHEDULE_DOT_COLORS[i % SCHEDULE_DOT_COLORS.length]}`} />
                            <span className="font-semibold text-gray-700">{opt.label}</span>
                            <span className="text-gray-400">{fmtTime(opt.startTime)} – {fmtTime(opt.endTime)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════ RATES TAB ═══════════ */}
      {subTab === "rates" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">La tarifa base por hora es la fuente única de verdad para el cálculo de precios.</p>
            <button onClick={() => { setRateRoomId(rooms[0]?.id || ""); setShowRateModal(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors shrink-0">
              <PlusIcon className="h-4 w-4" /> Nueva Tarifa
            </button>
          </div>
          <div className="space-y-4">
            {rooms.map((room) => {
              const roomRates = rates.filter((r) => r.roomId === room.id).sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
              const current = roomRates.find((r) => !r.effectiveUntil);
              const history = roomRates.filter((r) => r.effectiveUntil);
              return (
                <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{room.name}</span>
                      {current && <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Activa</span>}
                    </div>
                    {current && <span className="text-2xl font-bold text-gray-900">{fmt(current.hourlyRate)}<span className="text-sm font-normal text-gray-400"> /hr</span></span>}
                  </div>
                  {current ? (
                    <div className="px-4 py-3 flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Vigente desde</span>
                        <p className="text-gray-700 font-medium mt-0.5">{new Date(current.effectiveFrom).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Moneda</span>
                        <p className="text-gray-700 font-medium mt-0.5">{current.currency}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Sin tarifa configurada</div>
                  )}
                  {history.length > 0 && (
                    <div className="border-t border-gray-100">
                      <div className="px-4 py-2 bg-gray-50/30">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Historial</span>
                      </div>
                      {history.map((r) => (
                        <div key={r.id} className="flex items-center px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                          <ArchiveIcon className="h-3.5 w-3.5 mr-2 shrink-0" />
                          <span className="font-medium text-gray-500 w-20">{fmt(r.hourlyRate)}</span>
                          <span>{new Date(r.effectiveFrom).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "2-digit" })} → {new Date(r.effectiveUntil!).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════ PACKAGE MODAL ═══════════ */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingPkg ? "Editar Paquete" : "Nuevo Paquete"}</h3>
              <button onClick={closeModal} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"><XIcon className="h-5 w-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className={labelClass}>Nombre del paquete</label>
                <input className={inputClass} value={pkgForm.name} onChange={(e) => setField("name", e.target.value)} placeholder="Ej: Plan Medio Día" />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Descripción</label>
                <textarea className={inputClass} rows={2} value={pkgForm.description} onChange={(e) => setField("description", e.target.value)} placeholder="Descripción breve..." />
              </div>

              {/* Billing Unit + Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tipo de facturación</label>
                  <select className={inputClass} value={pkgForm.billingUnit} onChange={(e) => setField("billingUnit", e.target.value)}>
                    <option value="hour">Por Hora</option>
                    <option value="half_day">Medio Día</option>
                    <option value="full_day">Día Completo</option>
                    <option value="flat">Tarifa Fija</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Sala</label>
                  <select className={inputClass} value={pkgForm.roomId} onChange={(e) => setField("roomId", e.target.value)}>
                    <option value="">Todas las salas</option>
                    {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Duración mín (min)</label>
                  <input type="number" className={inputClass} value={pkgForm.minDuration} onChange={(e) => setField("minDuration", e.target.value)} placeholder="60" />
                </div>
                <div>
                  <label className={labelClass}>Duración máx (min)</label>
                  <input type="number" className={inputClass} value={pkgForm.maxDuration} onChange={(e) => setField("maxDuration", e.target.value)} placeholder="660" />
                </div>
              </div>

              {/* ─── CONDITIONAL: Discount + Block Hours (NOT for "hour" or "custom") ─── */}
              {needsDiscount(pkgForm.billingUnit) && (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Configuración de Descuento</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>% Descuento</label>
                      <input type="number" min="0" max="100" className={inputClass} value={pkgForm.discountPct} onChange={(e) => setField("discountPct", e.target.value)} />
                      <p className="text-[11px] text-gray-400 mt-1">Sobre la tarifa base por hora</p>
                    </div>
                    <div>
                      <label className={labelClass}>Horas del bloque</label>
                      <input type="number" step="0.5" className={inputClass} value={pkgForm.blockHours} onChange={(e) => setField("blockHours", e.target.value)} placeholder="5.5" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pkgForm.bulkEligible} onChange={(e) => setField("bulkEligible", e.target.checked)} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">Elegible para Cliente Frecuente</span>
                  </label>
                </>
              )}

              {/* ─── CONDITIONAL: Schedule Blocks (NOT for "hour") ─── */}
              {needsSchedule(pkgForm.billingUnit) && (
                <>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Bloques de Horario</p>
                      <button type="button" onClick={addScheduleOption} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors border border-purple-200">
                        <PlusIcon className="h-3 w-3" /> Agregar bloque
                      </button>
                    </div>

                    {pkgForm.scheduleOptions.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                        <ClockIcon className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Sin bloques de horario configurados</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Agrega bloques como "Mañana 08:00–13:30"</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {pkgForm.scheduleOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${SCHEDULE_DOT_COLORS[i % SCHEDULE_DOT_COLORS.length]}`} />
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => updateScheduleOption(i, "label", e.target.value)}
                            placeholder="Ej: Mañana"
                            className="bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-sm text-gray-900 w-28 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                          <input
                            type="time"
                            value={opt.startTime}
                            onChange={(e) => updateScheduleOption(i, "startTime", e.target.value)}
                            className="bg-white border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                          <span className="text-gray-400 text-sm">–</span>
                          <input
                            type="time"
                            value={opt.endTime}
                            onChange={(e) => updateScheduleOption(i, "endTime", e.target.value)}
                            className="bg-white border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                          <button onClick={() => removeScheduleOption(i)} className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Hourly info box */}
              {pkgForm.billingUnit === "hour" && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Paquete por hora</p>
                  <p className="text-sm text-blue-700">Este paquete usa la tarifa base directamente, sin descuento ni horario fijo. El precio se toma del valor en la tabla de Tarifa Base.</p>
                </div>
              )}

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pkgForm.isActive} onChange={(e) => setField("isActive", e.target.checked)} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700">Paquete activo</span>
              </label>

              {/* Live price preview */}
              {pkgForm.roomId && getActiveRate(pkgForm.roomId, rates) > 0 && needsDiscount(pkgForm.billingUnit) && (() => {
                const hr = getActiveRate(pkgForm.roomId, rates);
                const d = parseFloat(pkgForm.discountPct) || 0;
                const bh = parseFloat(pkgForm.blockHours) || 1;
                const cp = computePrice(hr, d, bh);
                return (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">Vista previa de precio (calculado por VIEW)</p>
                    <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                      <span className="text-gray-500">Tarifa base</span><span className="text-right font-semibold">{fmt(hr)}/hr</span>
                      <span className="text-gray-500">Descuento</span><span className="text-right font-semibold">{d}%</span>
                      <span className="text-gray-500">Efectivo/hr</span><span className="text-right font-semibold text-emerald-600">{fmt(cp.effective)}</span>
                      {bh > 0 && (
                        <>
                          <span className="text-gray-500">Horas bloque</span><span className="text-right font-semibold">{bh}h</span>
                          <span className="text-gray-700 font-semibold border-t border-purple-200 pt-1.5">Total</span>
                          <span className="text-right text-lg font-bold text-purple-700 border-t border-purple-200 pt-1.5">{fmt(cp.total)}</span>
                          <span className="text-gray-500">Ahorro</span><span className="text-right font-semibold text-emerald-600">{fmt(hr * bh - cp.total)}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
              <button onClick={savePkg} disabled={!pkgForm.name} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50">{editingPkg ? "Guardar Cambios" : "Crear Paquete"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ RATE MODAL ═══════════ */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowRateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Tarifa Base</h3>
              <button onClick={() => setShowRateModal(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"><XIcon className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Sala</label>
                <select className={inputClass} value={rateRoomId} onChange={(e) => setRateRoomId(e.target.value)}>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tarifa por hora (MXN)</label>
                <input type="number" min="0" step="10" className={inputClass} value={rateValue} onChange={(e) => setRateValue(e.target.value)} placeholder="400" />
                <p className="text-[11px] text-gray-400 mt-1">La tarifa anterior se archivará automáticamente.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <button onClick={() => setShowRateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
              <button onClick={saveRate} disabled={!rateRoomId || !rateValue} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50">Guardar Tarifa</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE MODAL ═══════════ */}
      {deletingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeletingPkg(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 text-center">
              <AlertTriangleIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Eliminar Paquete</h3>
              <p className="text-sm text-gray-500 mb-1">¿Estás seguro de eliminar</p>
              <p className="text-base font-bold text-gray-900 mb-3">{deletingPkg.name}?</p>
              <p className="text-xs text-red-500">Las reservaciones existentes no se verán afectadas.</p>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <button onClick={() => setDeletingPkg(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
              <button onClick={deletePkg} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingSettings;