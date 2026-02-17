import React, { useState, Fragment } from 'react';
import { DownloadIcon, CalendarIcon, BarChart2Icon, PieChartIcon, TrendingUpIcon, FilterIcon, RefreshCwIcon } from 'lucide-react';
const AdminReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'financial' | 'usage' | 'occupancy'>('financial');
  // Mock data for the reports
  const financialData = {
    revenue: 25000,
    expenses: 8000,
    profit: 17000,
    compareLastPeriod: 15,
    topDays: [{
      day: 'Miércoles',
      revenue: 5200
    }, {
      day: 'Jueves',
      revenue: 4800
    }, {
      day: 'Viernes',
      revenue: 4500
    }],
    revenueBySource: [{
      source: 'Reservas por hora',
      amount: 15000,
      percentage: 60
    }, {
      source: 'Paquetes',
      amount: 7500,
      percentage: 30
    }, {
      source: 'Bebidas',
      amount: 2500,
      percentage: 10
    }]
  };
  const usageData = {
    totalHours: 125,
    totalReservations: 42,
    averageDuration: 3,
    compareLastPeriod: 8,
    mostUsedResources: [{
      resource: 'TV',
      count: 38,
      percentage: 90
    }, {
      resource: 'Wi-Fi',
      count: 42,
      percentage: 100
    }, {
      resource: 'Micrófono',
      count: 25,
      percentage: 60
    }],
    reservationsByDay: [{
      day: 'Lunes',
      count: 5
    }, {
      day: 'Martes',
      count: 6
    }, {
      day: 'Miércoles',
      count: 9
    }, {
      day: 'Jueves',
      count: 8
    }, {
      day: 'Viernes',
      count: 10
    }, {
      day: 'Sábado',
      count: 3
    }, {
      day: 'Domingo',
      count: 1
    }]
  };
  const occupancyData = {
    overallOccupancy: 68,
    compareLastPeriod: 5,
    peakHours: [{
      time: '10:00 - 11:00',
      percentage: 85
    }, {
      time: '15:00 - 16:00',
      percentage: 90
    }, {
      time: '16:00 - 17:00',
      percentage: 80
    }],
    occupancyByDay: [{
      day: 'Lunes',
      percentage: 60
    }, {
      day: 'Martes',
      percentage: 55
    }, {
      day: 'Miércoles',
      percentage: 75
    }, {
      day: 'Jueves',
      percentage: 70
    }, {
      day: 'Viernes',
      percentage: 85
    }, {
      day: 'Sábado',
      percentage: 40
    }, {
      day: 'Domingo',
      percentage: 20
    }]
  };
  // Function to render the report content based on the selected type
  const renderReportContent = () => {
    switch (reportType) {
      case 'financial':
        return renderFinancialReport();
      case 'usage':
        return renderUsageReport();
      case 'occupancy':
        return renderOccupancyReport();
      default:
        return null;
    }
  };
  // Render the financial report
  const renderFinancialReport = () => {
    return <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Ingresos Totales
            </h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-white">
                ${financialData.revenue.toLocaleString()}
              </p>
              <p className="ml-2 text-sm text-green-500">
                +{financialData.compareLastPeriod}%
              </p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Gastos</h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-white">
                ${financialData.expenses.toLocaleString()}
              </p>
              <p className="ml-2 text-sm text-gray-400">Fijo</p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Utilidad</h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-green-400">
                ${financialData.profit.toLocaleString()}
              </p>
              <p className="ml-2 text-sm text-green-500">
                +{financialData.compareLastPeriod}%
              </p>
            </div>
          </div>
        </div>
        {/* Revenue by Day Chart */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Ingresos por Día de la Semana
          </h3>
          <div className="h-64 flex items-end justify-between mt-6">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => {
            const height = [60, 45, 85, 75, 65, 30, 20][index];
            return <div key={day} className="flex flex-col items-center w-full">
                    <div className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-sm" style={{
                height: `${height}%`
              }}></div>
                    <div className="text-xs text-gray-400 mt-2">{day}</div>
                  </div>;
          })}
          </div>
        </div>
        {/* Revenue by Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Ingresos por Fuente
            </h3>
            <div className="space-y-4">
              {financialData.revenueBySource.map(item => <div key={item.source}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">{item.source}</span>
                    <span className="text-sm text-white">
                      ${item.amount.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{
                  width: `${item.percentage}%`
                }}></div>
                  </div>
                </div>)}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Días con Mayores Ingresos
            </h3>
            <div className="space-y-4">
              {financialData.topDays.map((item, index) => <div key={item.day} className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : index === 1 ? 'bg-gray-500/20 text-gray-400' : 'bg-amber-700/20 text-amber-600'}`}>
                    {index + 1}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-white">
                        {item.day}
                      </h4>
                      <span className="text-sm text-gray-300">
                        ${item.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : 'bg-amber-700'}`} style={{
                    width: `${item.revenue / financialData.topDays[0].revenue * 100}%`
                  }}></div>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>;
  };
  // Render the usage report
  const renderUsageReport = () => {
    return <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Horas Totales
            </h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-white">
                {usageData.totalHours}
              </p>
              <p className="ml-2 text-sm text-green-500">
                +{usageData.compareLastPeriod}%
              </p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Reservas</h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-white">
                {usageData.totalReservations}
              </p>
              <p className="ml-2 text-sm text-green-500">
                +{usageData.compareLastPeriod}%
              </p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Duración Promedio
            </h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-white">
                {usageData.averageDuration} hrs
              </p>
              <p className="ml-2 text-sm text-gray-400">por reserva</p>
            </div>
          </div>
        </div>
        {/* Reservations by Day Chart */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Reservas por Día
          </h3>
          <div className="h-64 flex items-end justify-between mt-6">
            {usageData.reservationsByDay.map(item => <div key={item.day} className="flex flex-col items-center w-full">
                <div className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t-sm" style={{
              height: `${item.count / Math.max(...usageData.reservationsByDay.map(d => d.count)) * 100}%`
            }}></div>
                <div className="text-xs text-gray-400 mt-2">
                  {item.day.substring(0, 3)}
                </div>
                <div className="text-xs text-white">{item.count}</div>
              </div>)}
          </div>
        </div>
        {/* Most Used Resources */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Recursos Más Utilizados
          </h3>
          <div className="space-y-4">
            {usageData.mostUsedResources.map(item => <div key={item.resource}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">{item.resource}</span>
                  <span className="text-sm text-white">
                    {item.count} reservas ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{
                width: `${item.percentage}%`
              }}></div>
                </div>
              </div>)}
          </div>
        </div>
        {/* Usage Patterns */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Patrones de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Duración de Reservas
              </h4>
              <div className="space-y-2">
                {[{
                duration: '1 hora',
                percentage: 20
              }, {
                duration: '2 horas',
                percentage: 35
              }, {
                duration: '3 horas',
                percentage: 25
              }, {
                duration: '4+ horas',
                percentage: 20
              }].map(item => <div key={item.duration}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">
                        {item.duration}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{
                    width: `${item.percentage}%`
                  }}></div>
                    </div>
                  </div>)}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Tipo de Cliente
              </h4>
              <div className="space-y-2">
                {[{
                type: 'Individual',
                percentage: 40
              }, {
                type: 'Empresa pequeña',
                percentage: 35
              }, {
                type: 'Empresa grande',
                percentage: 15
              }, {
                type: 'Otro',
                percentage: 10
              }].map(item => <div key={item.type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">{item.type}</span>
                      <span className="text-xs text-gray-400">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full" style={{
                    width: `${item.percentage}%`
                  }}></div>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>;
  };
  // Render the occupancy report
  const renderOccupancyReport = () => {
    return <div className="space-y-8">
        {/* Summary Card */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Ocupación General
          </h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-white">
              {occupancyData.overallOccupancy}%
            </p>
            <p className="ml-2 text-sm text-green-500">
              +{occupancyData.compareLastPeriod}%
            </p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-zinc-700 rounded-full h-3">
              <div className={`h-3 rounded-full ${occupancyData.overallOccupancy >= 70 ? 'bg-green-500' : occupancyData.overallOccupancy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{
              width: `${occupancyData.overallOccupancy}%`
            }}></div>
            </div>
          </div>
        </div>
        {/* Occupancy by Day Chart */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Ocupación por Día
          </h3>
          <div className="space-y-4">
            {occupancyData.occupancyByDay.map(item => <div key={item.day}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">{item.day}</span>
                  <span className="text-sm text-white">{item.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.percentage >= 70 ? 'bg-green-500' : item.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{
                width: `${item.percentage}%`
              }}></div>
                </div>
              </div>)}
          </div>
        </div>
        {/* Peak Hours */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Horas Pico</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {occupancyData.peakHours.map((item, index) => <div key={item.time} className="bg-zinc-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">
                    {item.time}
                  </h4>
                  <span className={`text-sm font-medium ${item.percentage >= 80 ? 'text-green-500' : item.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{
                width: `${item.percentage}%`
              }}></div>
                </div>
              </div>)}
          </div>
        </div>
        {/* Heat Map */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Mapa de Calor de Ocupación
          </h3>
          <div className="grid grid-cols-8 gap-1">
            <div className="text-xs text-gray-400"></div>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day} className="text-xs text-center text-gray-400">
                {day}
              </div>)}
            {['9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18'].map(hour => <Fragment key={hour}>
                <div className="text-xs text-right text-gray-400 pr-2">
                  {hour}
                </div>
                {[0.8, 0.6, 0.9, 0.7, 0.9, 0.3, 0.2].map((value, index) => <div key={index} className={`h-6 rounded ${value >= 0.8 ? 'bg-green-500/80' : value >= 0.5 ? 'bg-yellow-500/80' : value >= 0.3 ? 'bg-orange-500/70' : 'bg-red-500/60'}`}></div>)}
              </Fragment>)}
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-green-500/80 mr-1"></div>
                <span className="text-xs text-gray-400">Alto (80%+)</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-yellow-500/80 mr-1"></div>
                <span className="text-xs text-gray-400">Medio (50-80%)</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-orange-500/70 mr-1"></div>
                <span className="text-xs text-gray-400">Bajo (30-50%)</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-red-500/60 mr-1"></div>
                <span className="text-xs text-gray-400">Muy bajo ( 30%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>;
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Reportes y Análisis</h1>
          <p className="text-gray-400 mt-2">
            Visualiza y exporta datos sobre el rendimiento de tu sala
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button type="button" className="inline-flex items-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-zinc-800 hover:bg-zinc-700">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center">
            <FilterIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-white">Filtros</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-400 mb-1">
                Período
              </label>
              <select id="dateRange" value={dateRange} onChange={e => setDateRange(e.target.value as any)} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Último año</option>
              </select>
            </div>
            <div>
              <label htmlFor="customDateStart" className="block text-sm font-medium text-gray-400 mb-1">
                Desde
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input type="date" id="customDateStart" className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div>
              <label htmlFor="customDateEnd" className="block text-sm font-medium text-gray-400 mb-1">
                Hasta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input type="date" id="customDateEnd" className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Report Type Tabs */}
      <div className="mb-6">
        <div className="border-b border-zinc-800">
          <nav className="flex -mb-px">
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${reportType === 'financial' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'}`} onClick={() => setReportType('financial')}>
              <div className="flex items-center">
                <BarChart2Icon className="h-5 w-5 mr-2" />
                Financiero
              </div>
            </button>
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${reportType === 'usage' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'}`} onClick={() => setReportType('usage')}>
              <div className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Uso
              </div>
            </button>
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${reportType === 'occupancy' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'}`} onClick={() => setReportType('occupancy')}>
              <div className="flex items-center">
                <TrendingUpIcon className="h-5 w-5 mr-2" />
                Ocupación
              </div>
            </button>
          </nav>
        </div>
      </div>
      {/* Report Content */}
      {renderReportContent()}
    </div>;
};
export default AdminReports;