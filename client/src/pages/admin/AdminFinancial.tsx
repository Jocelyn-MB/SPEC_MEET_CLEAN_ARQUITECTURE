import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSignIcon, TrendingUpIcon, AlertTriangleIcon,
  BarChart2Icon, ArrowUpIcon, ArrowDownIcon,
  CalendarIcon, SaveIcon, RefreshCwIcon, Loader2, CheckCircleIcon,
  Calculator, X, HelpCircle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import api from '../../api/axios';

// ─── Tipos ───────────────────────────────────────────────────
interface RealMetrics {
  lastMonthRevenue:       number;
  lastMonthHours:         number;
  lastMonthReservations:  number;
  avgTicket:              number;
  revenueHistory:         { month: string; amount: number }[];
}

const AdminFinancial: React.FC = () => {

  // ── Estados del simulador ──────────────────────────────────
  const [initialInvestment, setInitialInvestment]           = useState(150000);
  const [monthlyExpenses, setMonthlyExpenses]               = useState(8000);
  const [hourlyRate, setHourlyRate]                         = useState(200);
  const [estimatedHoursPerMonth, setEstimatedHoursPerMonth] = useState(100);
  const [elasticity, setElasticity]                         = useState(0.8);

  // ── Estados de API ─────────────────────────────────────────
  const [realMetrics, setRealMetrics]   = useState<RealMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  // ── Modal de calibración de elasticidad ────────────────────
  const [showElasticityModal, setShowElasticityModal] = useState(false);
  const [precioAnterior, setPrecioAnterior] = useState(180);
  const [horasAnteriores, setHorasAnteriores] = useState(110);
  const [precioNuevo, setPrecioNuevo] = useState(200);
  const [horasNuevas, setHorasNuevas] = useState(100);
  const [elasticidadCalculada, setElasticidadCalculada] = useState<number | null>(null);

  // Calcular elasticidad desde datos históricos
  const calcularElasticidadReal = () => {
    const cambioPrecio = (precioNuevo - precioAnterior) / precioAnterior;
    const cambioHoras = (horasNuevas - horasAnteriores) / horasAnteriores;
    
    if (cambioPrecio === 0) {
      alert('El precio anterior y nuevo no pueden ser iguales');
      return;
    }
    
    const elasticidad = Math.abs(cambioHoras / cambioPrecio);
    setElasticidadCalculada(elasticidad);
  };

  const aplicarElasticidadCalculada = () => {
    if (elasticidadCalculada !== null) {
      setElasticity(Number(elasticidadCalculada.toFixed(2)));
      setShowElasticityModal(false);
      setElasticidadCalculada(null);
    }
  };

  // ── Carga inicial: métricas reales + tarifa actual ─────────
  const fetchData = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      setErrorMsg(null);
      const [metricsRes, pricingRes] = await Promise.all([
        api.get('/admin/financial/metrics'),
        api.get('/admin/settings/pricing'),
      ]);
      setRealMetrics(metricsRes.data);
      if (pricingRes.data?.pricePerHour) {
        setHourlyRate(Number(pricingRes.data.pricePerHour));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Error cargando datos');
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Guardar configuración ADMIN PASSWORD:123456#──────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/financial/config', {
        initialInvestment,
        monthlyFixedCosts:    monthlyExpenses,
        currentHourlyRate:    hourlyRate,
        estimatedHoursPerDay: Math.round(estimatedHoursPerMonth / 22),
        operationalDaysMonth: 22,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  // ── Cálculos financieros ───────────────────────────────────
  const monthlyRevenue        = hourlyRate * estimatedHoursPerMonth;
  const monthlyProfit         = monthlyRevenue - monthlyExpenses;
  const breakEvenMonths       = monthlyProfit > 0 ? Math.ceil(initialInvestment / monthlyProfit) : Infinity;
  const roi                   = monthlyProfit > 0 ? (monthlyProfit * 12 / initialInvestment) * 100 : 0;
  const breakEvenHoursPerMonth = Math.ceil(monthlyExpenses / hourlyRate);

  // Tasa de ocupación (máximo 13h × 22 días = 286h/mes)
  const maxHoursPerMonth = 13 * 22;
  const occupancyRate = (estimatedHoursPerMonth / maxHoursPerMonth) * 100;

  // ── Función para calcular horas con elasticidad ────────────
  const calcularHorasConElasticidad = (precioNuevo: number): number => {
    if (hourlyRate === 0) return estimatedHoursPerMonth;
    const cambioPorcentualPrecio = (precioNuevo - hourlyRate) / hourlyRate;
    const cambioPorcentualHoras = -elasticity * cambioPorcentualPrecio;
    const horasNuevas = estimatedHoursPerMonth * (1 + cambioPorcentualHoras);
    return Math.max(0, Math.round(horasNuevas));
  };

  // ── 3 Escenarios con Elasticidad Económica ─────────────────
  const getPriceScenarios = () => {
    // Conservador: -15% precio
    const precioConservador = hourlyRate * 0.85;
    const horasConservador = calcularHorasConElasticidad(precioConservador);
    const ingresoConservador = precioConservador * horasConservador;
    const utilidadConservador = ingresoConservador - monthlyExpenses;

    // Actual
    const ingresoActual = monthlyRevenue;
    const utilidadActual = monthlyProfit;

    // Optimista: +20% precio
    const precioOptimista = hourlyRate * 1.20;
    const horasOptimista = calcularHorasConElasticidad(precioOptimista);
    const ingresoOptimista = precioOptimista * horasOptimista;
    const utilidadOptimista = ingresoOptimista - monthlyExpenses;

    return [
      {
        scenario: 'Conservador',
        precio: Math.round(precioConservador),
        horas: horasConservador,
        ingreso: ingresoConservador,
        utilidad: utilidadConservador,
        change: ((utilidadConservador - utilidadActual) / Math.abs(utilidadActual || 1) * 100).toFixed(1)
      },
      {
        scenario: 'Actual',
        precio: hourlyRate,
        horas: estimatedHoursPerMonth,
        ingreso: ingresoActual,
        utilidad: utilidadActual,
        change: '0'
      },
      {
        scenario: 'Optimista',
        precio: Math.round(precioOptimista),
        horas: horasOptimista,
        ingreso: ingresoOptimista,
        utilidad: utilidadOptimista,
        change: ((utilidadOptimista - utilidadActual) / Math.abs(utilidadActual || 1) * 100).toFixed(1)
      }
    ];
  };

  const priceScenarios = getPriceScenarios();

  // ── Recomendaciones ────────────────────────────────────────
  const getRecommendations = () => {
    const recommendations = [];
    
    if (breakEvenMonths > 24) {
      recommendations.push({
        type: 'warning',
        title: 'Retorno de inversión lento',
        description: 'El retorno tomará más de 2 años. Considera aumentar la tarifa o reducir gastos.'
      });
    }
    
    if (estimatedHoursPerMonth < breakEvenHoursPerMonth * 1.2) {
      recommendations.push({
        type: 'warning',
        title: 'Margen de utilidad bajo',
        description: `Necesitas vender al menos ${breakEvenHoursPerMonth}h/mes para cubrir gastos.`
      });
    }

    // Análisis de escenarios
    const mejorEscenario = priceScenarios.reduce((prev, current) => 
      current.utilidad > prev.utilidad ? current : prev
    );

    if (mejorEscenario.scenario !== 'Actual') {
      recommendations.push({
        type: 'info',
        title: `Escenario "${mejorEscenario.scenario}" es más rentable`,
        description: `Cambiar a $${mejorEscenario.precio}/h aumentaría tu utilidad en ${Math.abs(Number(mejorEscenario.change))}%.`
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Modelo financiero saludable',
        description: 'Tus parámetros muestran un modelo rentable con buen ROI.'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  // ── Datos para gráfica de Análisis de Ocupación ───────────
  const ocupacionData = [20, 40, 60, 80, 100, 120, 140].map(horas => ({
    horas,
    utilidad: hourlyRate * horas - monthlyExpenses,
    equilibrio: horas === breakEvenHoursPerMonth
  }));

  // ── Datos para gráfica de Proyección a 3 Años ─────────────
  const proyeccionData = [1, 2, 3].map(year => ({
    year: `Año ${year}`,
    ingresos: monthlyRevenue * 12 * Math.pow(1.05, year - 1), // Crecimiento 5% anual
    gastos: monthlyExpenses * 12,
    utilidad: (monthlyRevenue * 12 * Math.pow(1.05, year - 1)) - (monthlyExpenses * 12)
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Simulador Financiero
          </h1>
          <p className="text-gray-400 mt-2">
            Analiza la rentabilidad y optimiza tu modelo de negocio
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
          >
            {saveSuccess
              ? <><CheckCircleIcon className="h-4 w-4 mr-2" />Guardado</>
              : saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</>
              : <><SaveIcon className="h-4 w-4 mr-2" />Guardar</>
            }
          </button>
          <button
            type="button"
            onClick={fetchData}
            disabled={loadingMetrics}
            className="inline-flex items-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60"
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loadingMetrics ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Banner de Métricas Reales (SIN FILTRO, SIN TICKET) ── */}
      {!loadingMetrics && realMetrics && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-white mb-4">
            Métricas Reales (Último Mes)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                label: 'Ingresos', 
                value: `$${realMetrics.lastMonthRevenue.toLocaleString('es-MX')}`,
                icon: '💰'
              },
              { 
                label: 'Horas vendidas', 
                value: `${realMetrics.lastMonthHours.toFixed(1)}h`,
                icon: '⏱️'
              },
              { 
                label: 'Reservaciones', 
                value: `${realMetrics.lastMonthReservations}`,
                icon: '📅'
              },
            ].map((item, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                <p className="text-xs text-gray-500 mb-1">
                  {item.icon} {item.label}
                </p>
                <p className="text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {loadingMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 animate-pulse h-20" />
          ))}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 text-yellow-300 text-sm flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: PARÁMETROS | RESULTADOS | OPTIMIZACIÓN          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* ── Parámetros Financieros ────────────────────────────── */}
        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Parámetros Financieros
          </h2>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Inversión Inicial (MXN)
              </label>
              <div className="relative">
                <DollarSignIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={initialInvestment}
                  onChange={e => setInitialInvestment(Number(e.target.value))}
                  className="bg-zinc-800 w-full pl-10 pr-3 py-2 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Equipamiento, cerradura, mobiliario, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Gastos Mensuales (MXN)
              </label>
              <div className="relative">
                <DollarSignIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={e => setMonthlyExpenses(Number(e.target.value))}
                  className="bg-zinc-800 w-full pl-10 pr-3 py-2 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Renta, servicios, limpieza, mantenimiento
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tarifa por Hora (MXN)
              </label>
              <div className="relative">
                <DollarSignIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  className="bg-zinc-800 w-full pl-10 pr-3 py-2 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Horas Estimadas/Mes
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={estimatedHoursPerMonth}
                  onChange={e => setEstimatedHoursPerMonth(Number(e.target.value))}
                  className="bg-zinc-800 w-full pl-10 pr-3 py-2 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Ocupación: {occupancyRate.toFixed(1)}% de capacidad
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-700">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Elasticidad de Demanda
                </label>
                <button
                  onClick={() => setShowElasticityModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  Calibrar
                </button>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="3"
                value={elasticity}
                onChange={e => setElasticity(Number(e.target.value))}
                className="bg-zinc-800 w-full py-2 px-3 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>• 0.5-0.7: Corporativos (poco sensibles)</p>
                <p>• 0.8-1.0: Mixto (recomendado)</p>
                <p>• 1.2-1.5: Freelancers (muy sensibles)</p>
              </div>
              
              {/* Tooltip explicativo */}
              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-blue-300">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>¿Cómo encontrar mi elasticidad?</strong>
                    <p className="mt-1 opacity-90">
                      1. Haz un cambio de precio y espera 1 mes<br/>
                      2. Mide las horas vendidas reales<br/>
                      3. Click en "Calibrar" para calcularla automáticamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Recomendaciones</h3>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm ${
                  rec.type === 'warning'
                    ? 'bg-yellow-900/20 border border-yellow-700/50 text-yellow-300'
                    : rec.type === 'success'
                    ? 'bg-green-900/20 border border-green-700/50 text-green-300'
                    : 'bg-blue-900/20 border border-blue-700/50 text-blue-300'
                }`}
              >
                <div className="font-medium mb-1">{rec.title}</div>
                <div className="text-xs opacity-90">{rec.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Resultados Financieros ────────────────────────────── */}
        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Resultados Financieros
          </h2>
          <div className="space-y-4">

            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Ingresos/Mes</span>
                <span className="text-green-400 font-semibold">
                  ${monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {estimatedHoursPerMonth}h × ${hourlyRate}
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Gastos/Mes</span>
                <span className="text-red-400 font-semibold">
                  ${monthlyExpenses.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Utilidad/Mes</span>
                <span className={`font-semibold ${
                  monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${monthlyProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Anual</span>
                <span className={monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${(monthlyProfit * 12).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg border-l-4 border-yellow-500">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Punto Equilibrio</span>
                <span className="text-yellow-400 font-semibold">
                  {breakEvenHoursPerMonth}h/mes
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Horas mínimas para cubrir gastos
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Recuperación</span>
                <span className="text-white font-semibold">
                  {breakEvenMonths === Infinity ? '∞' : breakEvenMonths} meses
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {breakEvenMonths === Infinity 
                  ? 'Utilidad negativa'
                  : `${(breakEvenMonths / 12).toFixed(1)} años`
                }
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-lg border border-purple-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-300">ROI Anual</span>
                <span className="text-2xl font-bold text-purple-200">
                  {roi.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Retorno sobre inversión de ${initialInvestment.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Optimización de Precios ───────────────────────────── */}
        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Optimización de Precios
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Escenarios basados en elasticidad {elasticity}
          </p>

          <div className="space-y-3">
            {priceScenarios.map((escenario, idx) => {
              const esActual = escenario.scenario === 'Actual';
              const esMejor = !esActual && 
                escenario.utilidad === Math.max(...priceScenarios.map(e => e.utilidad));

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    esActual
                      ? 'bg-zinc-800/50 border-zinc-600'
                      : esMejor
                      ? 'bg-green-900/20 border-green-600'
                      : 'bg-zinc-800/30 border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-semibold ${
                        esMejor ? 'text-green-300' : 'text-white'
                      }`}>
                        {escenario.scenario}
                      </h3>
                      {esMejor && (
                        <span className="text-xs text-green-400">✓ Más rentable</span>
                      )}
                    </div>
                    <div className={`text-right text-sm font-medium ${
                      Number(escenario.change) > 0 ? 'text-green-400' :
                      Number(escenario.change) < 0 ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {Number(escenario.change) !== 0 && (
                        <>
                          {Number(escenario.change) > 0 ? <ArrowUpIcon className="inline h-4 w-4" /> : <ArrowDownIcon className="inline h-4 w-4" />}
                          {Math.abs(Number(escenario.change))}%
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Precio:</span>
                      <span className="text-white ml-1">${escenario.precio}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Horas:</span>
                      <span className="text-white ml-1">{escenario.horas}h</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-gray-400">Utilidad:</span>
                      <span className={`ml-1 font-semibold ${
                        escenario.utilidad > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${escenario.utilidad.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nota metodológica */}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>📊 Elasticidad de demanda:</strong> Mide cómo cambia la cantidad vendida al variar el precio. 
              Formula: % Cambio Horas = -Elasticidad × % Cambio Precio
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: GRÁFICAS (2 COLUMNAS)                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── Gráfica: Análisis de Ocupación ────────────────────── */}
        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Análisis de Ocupación
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ocupacionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="horas" 
                stroke="#9CA3AF"
                label={{ value: 'Horas/mes', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                label={{ value: 'Utilidad (MXN)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#10b981' }}
              />
              <ReferenceLine 
                y={0} 
                stroke="#ef4444" 
                strokeDasharray="3 3"
                label={{ value: 'Punto de Equilibrio', fill: '#fbbf24', position: 'right' }}
              />
              <Bar 
                dataKey="utilidad" 
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 text-center mt-3">
            Muestra cómo varía la utilidad según horas vendidas. La línea roja marca el punto de equilibrio.
          </p>
        </div>

        {/* ── Gráfica: Proyección a 3 Años ──────────────────────── */}
        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">
            Proyección a 3 Años
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={proyeccionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="year" 
                stroke="#9CA3AF"
              />
              <YAxis 
                stroke="#9CA3AF"
                label={{ value: 'MXN', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ingresos" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Ingresos"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="gastos" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Gastos"
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="utilidad" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Utilidad"
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Resumen numérico */}
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total 3 años (Utilidad)</span>
              <span className="text-green-400 font-semibold">
                ${proyeccionData.reduce((sum, d) => sum + d.utilidad, 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Proyección asume crecimiento del 5% anual en ingresos. Gastos fijos constantes.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL: CALIBRADOR DE ELASTICIDAD                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showElasticityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-zinc-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Calculator className="h-6 w-6 mr-2 text-purple-400" />
                    Calibrador de Elasticidad
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Calcula tu elasticidad real basada en un cambio de precio que hayas hecho
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowElasticityModal(false);
                    setElasticidadCalculada(null);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Instrucciones */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-300 mb-2">
                  📘 ¿Cómo usar este calibrador?
                </h3>
                <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Ingresa el precio y horas de un mes <strong>anterior</strong></li>
                  <li>Ingresa el precio y horas de un mes <strong>posterior</strong> (después del cambio)</li>
                  <li>El sistema calculará tu elasticidad real automáticamente</li>
                  <li>Aplica el valor calculado a tu simulador</li>
                </ol>
              </div>

              {/* Formulario en 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1: ANTES del cambio */}
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center">
                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
                    ANTES del cambio
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Precio Anterior (MXN/hora)
                      </label>
                      <input
                        type="number"
                        value={precioAnterior}
                        onChange={e => setPrecioAnterior(Number(e.target.value))}
                        className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-600 text-white text-sm"
                        placeholder="180"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Horas Vendidas (ese mes)
                      </label>
                      <input
                        type="number"
                        value={horasAnteriores}
                        onChange={e => setHorasAnteriores(Number(e.target.value))}
                        className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-600 text-white text-sm"
                        placeholder="110"
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Ejemplo: En Enero cobrabas $180/h y vendiste 110 horas
                  </div>
                </div>

                {/* Columna 2: DESPUÉS del cambio */}
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
                    DESPUÉS del cambio
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Precio Nuevo (MXN/hora)
                      </label>
                      <input
                        type="number"
                        value={precioNuevo}
                        onChange={e => setPrecioNuevo(Number(e.target.value))}
                        className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-600 text-white text-sm"
                        placeholder="200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Horas Vendidas (ese mes)
                      </label>
                      <input
                        type="number"
                        value={horasNuevas}
                        onChange={e => setHorasNuevas(Number(e.target.value))}
                        className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-600 text-white text-sm"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Ejemplo: En Febrero subiste a $200/h y vendiste 100 horas
                  </div>
                </div>
              </div>

              {/* Botón calcular */}
              <button
                onClick={calcularElasticidadReal}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md flex items-center justify-center"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calcular Elasticidad
              </button>

              {/* Resultado del cálculo */}
              {elasticidadCalculada !== null && (
                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-600 rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-green-300 mb-2">
                      ✅ Tu Elasticidad Real
                    </h3>
                    <div className="text-5xl font-bold text-green-400 mb-4">
                      {elasticidadCalculada.toFixed(2)}
                    </div>

                    {/* Interpretación automática */}
                    <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>Interpretación:</strong>
                      </p>
                      <p className="text-xs text-gray-400">
                        {elasticidadCalculada < 0.7 && (
                          <>
                            🏢 Tus clientes son <strong className="text-green-400">poco sensibles</strong> al precio (tipo corporativo). 
                            Por cada 10% que subas precio, solo pierdes {(elasticidadCalculada * 10).toFixed(1)}% de horas.
                            <strong className="text-green-400"> ¡Te conviene subir precios!</strong>
                          </>
                        )}
                        {elasticidadCalculada >= 0.7 && elasticidadCalculada <= 1.0 && (
                          <>
                            👥 Tus clientes tienen <strong className="text-yellow-400">sensibilidad moderada</strong> (mercado mixto).
                            Por cada 10% que subas precio, pierdes {(elasticidadCalculada * 10).toFixed(1)}% de horas.
                            <strong className="text-yellow-400"> Balance entre precio y volumen.</strong>
                          </>
                        )}
                        {elasticidadCalculada > 1.0 && (
                          <>
                            💼 Tus clientes son <strong className="text-red-400">muy sensibles</strong> al precio (freelancers).
                            Por cada 10% que subas precio, pierdes {(elasticidadCalculada * 10).toFixed(1)}% de horas.
                            <strong className="text-red-400"> Cuidado con subir precios mucho.</strong>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Desglose del cálculo */}
                    <div className="text-left bg-zinc-900/50 rounded-lg p-4 text-xs space-y-2">
                      <p className="font-medium text-gray-300 mb-2">📊 Desglose del cálculo:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Cambio precio:</span>
                          <span className={`ml-2 font-medium ${
                            precioNuevo > precioAnterior ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {((precioNuevo - precioAnterior) / precioAnterior * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cambio horas:</span>
                          <span className={`ml-2 font-medium ${
                            horasNuevas > horasAnteriores ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {((horasNuevas - horasAnteriores) / horasAnteriores * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-center mt-2">
                        Elasticidad = |Cambio Horas| ÷ |Cambio Precio|
                      </p>
                    </div>

                    {/* Botón aplicar */}
                    <button
                      onClick={aplicarElasticidadCalculada}
                      className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                    >
                      Aplicar al Simulador
                    </button>
                  </div>
                </div>
              )}

              {/* Ejemplo educativo */}
              {elasticidadCalculada === null && (
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    💡 Ejemplo práctico
                  </h3>
                  <div className="text-xs text-gray-400 space-y-2">
                    <p>
                      <strong className="text-white">Mes 1:</strong> Cobraba $180/h, vendí 110 horas
                    </p>
                    <p>
                      <strong className="text-white">Mes 2:</strong> Subí a $200/h (+11%), vendí 100 horas (-9%)
                    </p>
                    <p className="pt-2 border-t border-zinc-700">
                      <strong className="text-purple-400">Elasticidad = 9% ÷ 11% = 0.82</strong>
                    </p>
                    <p className="text-gray-500">
                      Significa: "Por cada 10% que subo precio, pierdo 8.2% de horas"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancial;