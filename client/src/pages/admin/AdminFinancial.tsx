import React, { useState } from 'react';
import { DollarSignIcon, TrendingUpIcon, AlertTriangleIcon, BarChart2Icon, ArrowUpIcon, ArrowDownIcon, CalendarIcon, SaveIcon, RefreshCwIcon } from 'lucide-react';
const AdminFinancial: React.FC = () => {
  // States for the financial simulator
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(8000);
  const [hourlyRate, setHourlyRate] = useState(200);
  const [estimatedHoursPerMonth, setEstimatedHoursPerMonth] = useState(80);
  // Calculate financial metrics
  const monthlyRevenue = hourlyRate * estimatedHoursPerMonth;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const breakEvenMonths = monthlyProfit > 0 ? Math.ceil(initialInvestment / monthlyProfit) : Infinity;
  const roi = monthlyProfit > 0 ? monthlyProfit * 12 / initialInvestment * 100 : 0;
  const breakEvenHoursPerMonth = Math.ceil(monthlyExpenses / hourlyRate);
  // AI recommendations based on the financial data
  const getAIRecommendations = () => {
    const recommendations = [];
    if (breakEvenMonths > 24) {
      recommendations.push({
        type: 'warning',
        title: 'Retorno de inversión lento',
        description: 'Con la configuración actual, el retorno de inversión tomará más de 2 años. Considera aumentar la tarifa por hora o reducir gastos.'
      });
    }
    if (estimatedHoursPerMonth < breakEvenHoursPerMonth * 1.2) {
      recommendations.push({
        type: 'warning',
        title: 'Margen de utilidad bajo',
        description: `Necesitas vender al menos ${breakEvenHoursPerMonth} horas por mes para cubrir gastos. Tu estimación actual está muy cerca de este punto.`
      });
    }
    if (hourlyRate < 150) {
      recommendations.push({
        type: 'info',
        title: 'Precio por debajo del mercado',
        description: 'Tu tarifa por hora está por debajo del promedio del mercado. Considera un aumento gradual para mejorar la rentabilidad.'
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Modelo financiero saludable',
        description: 'Tus parámetros actuales muestran un modelo de negocio rentable con un buen retorno de inversión.'
      });
    }
    return recommendations;
  };
  // Price optimization suggestions
  const getPriceOptimizationSuggestions = () => {
    return [{
      scenario: 'Optimista',
      hourlyRate: hourlyRate * 1.2,
      estimatedHours: estimatedHoursPerMonth * 0.9,
      profit: hourlyRate * 1.2 * (estimatedHoursPerMonth * 0.9) - monthlyExpenses,
      change: '+10%'
    }, {
      scenario: 'Actual',
      hourlyRate: hourlyRate,
      estimatedHours: estimatedHoursPerMonth,
      profit: monthlyProfit,
      change: '0%'
    }, {
      scenario: 'Conservador',
      hourlyRate: hourlyRate * 0.9,
      estimatedHours: estimatedHoursPerMonth * 1.15,
      profit: hourlyRate * 0.9 * (estimatedHoursPerMonth * 1.15) - monthlyExpenses,
      change: '+5%'
    }];
  };
  const aiRecommendations = getAIRecommendations();
  const priceScenarios = getPriceOptimizationSuggestions();
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
          <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            <SaveIcon className="h-4 w-4 mr-2" />
            Guardar Escenario
          </button>
          <button type="button" className="inline-flex items-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-zinc-800 hover:bg-zinc-700">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Recalcular
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input Parameters */}
        <div className="space-y-8">
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Parámetros Financieros
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="initialInvestment" className="block text-sm font-medium text-gray-300 mb-1">
                  Inversión Inicial (MXN)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="number" id="initialInvestment" value={initialInvestment} onChange={e => setInitialInvestment(Number(e.target.value))} className="bg-zinc-800 block w-full pl-10 pr-12 py-2 rounded-md border border-zinc-700 focus:ring-purple-500 focus:border-purple-500 text-white" placeholder="0" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 sm:text-sm">MXN</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Incluye equipamiento, cerradura, mobiliario, etc.
                </p>
              </div>
              <div>
                <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-gray-300 mb-1">
                  Gastos Mensuales (MXN)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="number" id="monthlyExpenses" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))} className="bg-zinc-800 block w-full pl-10 pr-12 py-2 rounded-md border border-zinc-700 focus:ring-purple-500 focus:border-purple-500 text-white" placeholder="0" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 sm:text-sm">MXN</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Renta, servicios, limpieza, mantenimiento, etc.
                </p>
              </div>
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-300 mb-1">
                  Tarifa por Hora (MXN)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="number" id="hourlyRate" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="bg-zinc-800 block w-full pl-10 pr-12 py-2 rounded-md border border-zinc-700 focus:ring-purple-500 focus:border-purple-500 text-white" placeholder="0" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 sm:text-sm">MXN</span>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="estimatedHoursPerMonth" className="block text-sm font-medium text-gray-300 mb-1">
                  Horas Estimadas por Mes
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="number" id="estimatedHoursPerMonth" value={estimatedHoursPerMonth} onChange={e => setEstimatedHoursPerMonth(Number(e.target.value))} className="bg-zinc-800 block w-full pl-10 pr-12 py-2 rounded-md border border-zinc-700 focus:ring-purple-500 focus:border-purple-500 text-white" placeholder="0" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 sm:text-sm">hrs</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Basado en tu ocupación esperada
                </p>
              </div>
            </div>
          </div>
          {/* AI Recommendations */}
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BarChart2Icon className="h-5 w-5 text-purple-400 mr-2" />
              <h2 className="text-lg font-medium text-white">
                Recomendaciones IA
              </h2>
            </div>
            <div className="space-y-4">
              {aiRecommendations.map((recommendation, index) => <div key={index} className={`p-4 rounded-lg ${recommendation.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-700/50' : recommendation.type === 'success' ? 'bg-green-900/20 border border-green-700/50' : 'bg-blue-900/20 border border-blue-700/50'}`}>
                  <div className="flex">
                    <div className={`flex-shrink-0 ${recommendation.type === 'warning' ? 'text-yellow-400' : recommendation.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                      {recommendation.type === 'warning' ? <AlertTriangleIcon className="h-5 w-5" /> : recommendation.type === 'success' ? <TrendingUpIcon className="h-5 w-5" /> : <BarChart2Icon className="h-5 w-5" />}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${recommendation.type === 'warning' ? 'text-yellow-300' : recommendation.type === 'success' ? 'text-green-300' : 'text-blue-300'}`}>
                        {recommendation.title}
                      </h3>
                      <div className="mt-2 text-sm text-gray-300">
                        <p>{recommendation.description}</p>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
        {/* Middle Column - Results */}
        <div className="space-y-8">
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Resultados Financieros
            </h2>
            <div className="space-y-6">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-300">
                    Ingresos Mensuales
                  </h3>
                  <span className="text-green-400 font-semibold">
                    ${monthlyRevenue.toLocaleString()} MXN
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Basado en {estimatedHoursPerMonth} horas a ${hourlyRate} MXN
                  por hora
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-300">
                    Gastos Mensuales
                  </h3>
                  <span className="text-red-400 font-semibold">
                    ${monthlyExpenses.toLocaleString()} MXN
                  </span>
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-300">
                    Utilidad Mensual
                  </h3>
                  <span className={`font-semibold ${monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${monthlyProfit.toLocaleString()} MXN
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <h3 className="text-xs font-medium text-gray-400">
                    Utilidad Anual Proyectada
                  </h3>
                  <span className={`font-semibold ${monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(monthlyProfit * 12).toLocaleString()} MXN
                  </span>
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-300">
                    Punto de Equilibrio
                  </h3>
                  <span className="text-white font-semibold">
                    {breakEvenHoursPerMonth} horas/mes
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Horas necesarias para cubrir gastos mensuales
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-300">
                    Retorno de Inversión
                  </h3>
                  <span className="text-white font-semibold">
                    {breakEvenMonths === Infinity ? '∞' : breakEvenMonths} meses
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Tiempo para recuperar la inversión inicial
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-300">
                    ROI Anual
                  </h3>
                  <span className={`font-semibold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {roi.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Retorno anual sobre la inversión
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Right Column - Optimization */}
        <div className="space-y-8">
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Optimización de Precios
            </h2>
            <div className="space-y-4">
              {priceScenarios.map((scenario, index) => <div key={index} className="bg-zinc-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-white">
                      {scenario.scenario}
                    </h3>
                    <span className={`text-sm font-medium ${scenario.profit > monthlyProfit ? 'text-green-400' : scenario.profit < monthlyProfit ? 'text-red-400' : 'text-gray-400'}`}>
                      {scenario.change !== '0%' && <>
                          {scenario.profit > monthlyProfit ? <ArrowUpIcon className="inline h-4 w-4 mr-1" /> : <ArrowDownIcon className="inline h-4 w-4 mr-1" />}
                        </>}
                      {scenario.change}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Tarifa:</span>
                      <span className="text-white ml-1">
                        ${scenario.hourlyRate} MXN
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Horas:</span>
                      <span className="text-white ml-1">
                        {scenario.estimatedHours}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Utilidad:</span>
                      <span className={`ml-1 ${scenario.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${scenario.profit.toFixed(0)} MXN
                      </span>
                    </div>
                  </div>
                </div>)}
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Análisis de Ocupación
              </h3>
              <div className="h-48 flex items-end space-x-2">
                {[20, 40, 60, 80, 100, 120].map((hours, index) => {
                const profit = hourlyRate * hours - monthlyExpenses;
                const height = Math.max(5, Math.min(100, profit / (hourlyRate * 120) * 100 + 50));
                return <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center">
                        <div className={`w-full rounded-t-sm ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{
                      height: `${height}%`
                    }}></div>
                        <div className="text-xs text-gray-400 mt-1">
                          {hours}h
                        </div>
                      </div>
                      {hours === breakEvenHoursPerMonth && <div className="absolute -mt-4">
                          <div className="px-1 py-0.5 bg-purple-600 text-white text-xs rounded">
                            Equilibrio
                          </div>
                        </div>}
                    </div>;
              })}
              </div>
              <div className="text-xs text-center text-gray-500 mt-2">
                Horas vendidas por mes
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Proyección a 3 Años
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Año 1</span>
                <span className="text-white">
                  ${(monthlyProfit * 12).toLocaleString()} MXN
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Año 2</span>
                <span className="text-white">
                  ${(monthlyProfit * 12 * 1.1).toLocaleString()} MXN
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Año 3</span>
                <span className="text-white">
                  ${(monthlyProfit * 12 * 1.2).toLocaleString()} MXN
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">
                    Total 3 años
                  </span>
                  <span className="text-green-400 font-semibold">
                    ${(monthlyProfit * 12 * (1 + 1.1 + 1.2)).toLocaleString()}{' '}
                    MXN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default AdminFinancial;