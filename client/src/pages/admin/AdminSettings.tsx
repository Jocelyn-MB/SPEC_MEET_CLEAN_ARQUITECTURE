import React, { useState, useEffect } from 'react';
import { 
  DollarSignIcon, FileTextIcon, 
  MapPinIcon, SaveIcon,WifiIcon, PlusIcon, TrashIcon, AlertCircle, Loader2, 
  Eye, Code 
} from 'lucide-react';

// Importamos nuestra API real
import { 
  getPricingSettings, updatePricingSettings, 
  getLocationSettings, updateLocationSettings,
  getTermsSettings, updateTermsSettings,
  getWifiSettings, updateWifiSettings,
  type PricingSettings,type LocationSettings, type TermsSettings,
  type WifiSettings
} from '../../api/settings.api';

// Mantenemos las interfaces locales para el estado del componente
interface Beverage {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
}

interface ResourcesSettings {
  beverages: Beverage[];
  wifiSettings: {
    networkName: string;
    password: string;
    showPassword: boolean;
  };
}

// Variables para la plantilla (Igual que antes)
const TEMPLATE_VARIABLES = [
  { key: '{HOURLY_RATE}', label: 'Tarifa por hora', example: '$200 MXN' },
  { key: '{FULL_REFUND_HOURS}', label: 'Horas para reembolso completo', example: '24' },
  { key: '{PARTIAL_REFUND_HOURS}', label: 'Horas para reembolso parcial', example: '12' },
  { key: '{PARTIAL_REFUND_PERCENTAGE}', label: 'Porcentaje de reembolso parcial', example: '50%' },
  { key: '{LOCATION_NAME}', label: 'Nombre de la sala', example: 'SPEC.MEET Central' },
  { key: '{LOCATION_ADDRESS}', label: 'Dirección', example: 'Av. Insurgentes Sur 1602...' },
  { key: '{CAPACITY}', label: 'Capacidad', example: '8 personas' },
  { key: '{WIFI_NETWORK}', label: 'Red WiFi', example: 'SPEC.MEET_Guest' },
  { key: '{PACKAGES_LIST}', label: 'Lista de paquetes', example: 'Paquete 5 horas: $900...' }
];

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'resources' | 'terms' | 'location'>('pricing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de carga independientes por botón
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [savingWifi, setSavingWifi] = useState(false); // ← AÑADIDO

  const [showPreview, setShowPreview] = useState(false);
  
  // --- ESTADOS DE DATOS ---
  const [wifiSettings, setWifiSettings] = useState<WifiSettings>({
    wifiName: '',
    wifiPassword: ''
  });

  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    hourlyRate: 0,
    packages: [],
    cancellationPolicy: { fullRefund: 24, partialRefund: 12, partialRefundPercentage: 50 }
  });
  
  // Mock local para recursos (Ya que no tiene backend aún)
  const [resourcesSettings, setResourcesSettings] = useState<ResourcesSettings>({
    beverages: [
       { id: 'coffee', name: 'Café (Demo)', price: 30, enabled: true },
    ],
    wifiSettings: { networkName: '', password: '', showPassword: true }
  });
  
  const [locationSettings, setLocationSettings] = useState<LocationSettings>({
    name: '',
    address: '',
    openingHours: {}, // Se llenará con lo que venga del back o vacío
    capacity: 0,
    accessInstructions: ''
  });
  
  const [termsSettings, setTermsSettings] = useState<TermsSettings>({
    template: '',
    additionalClauses: '',
    privacyOptions: { collectEmail: true, shareData: false, cctvNotice: true, cookieConsent: true }
  });

  // --- CARGA INICIAL (Promise.all para eficiencia) ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Ejecutamos las peticiones en paralelo
        const [pricingRes, locationRes, termsRes, wifiRes] = await Promise.allSettled([
          getPricingSettings(),
          getLocationSettings(),
          getTermsSettings(),
          getWifiSettings() // ← AÑADIDO
        ]);

        // Procesar Precios
        if (pricingRes.status === 'fulfilled') {
          setPricingSettings(pricingRes.value.data);
        } else {
          console.error("Error cargando precios");
        }

        // Procesar Ubicación
        if (locationRes.status === 'fulfilled') {
          // Aseguramos que openingHours sea un objeto válido
          const locData = locationRes.value.data;
          if (!locData.openingHours || Object.keys(locData.openingHours).length === 0) {
             // Default si viene vacío
             locData.openingHours = {
               monday: { open: '09:00', close: '19:00', closed: false },
               // ... puedes añadir el resto de días por defecto aquí si quieres
             };
          }
          setLocationSettings(locData);
        }

        // Procesar Términos
        if (termsRes.status === 'fulfilled') {
          setTermsSettings(termsRes.value.data);
        }

        // Procesar Wi-Fi ← AÑADIDO
        if (wifiRes.status === 'fulfilled') {
          setWifiSettings(wifiRes.value.data);
        }

      } catch (err) {
        setError('Error general al cargar la configuración.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // --- FUNCIONES DE GUARDADO INDEPENDIENTES ---

  const handleSaveWifi = async () => {
    setSavingWifi(true);
    try {
      await updateWifiSettings(wifiSettings);
      alert('Configuración Wi-Fi guardada correctamente');
    } catch (error) {
      console.error('Error saving wifi settings:', error);
      alert('Error al guardar configuración Wi-Fi');
    } finally {
      setSavingWifi(false);
    }
  };
  
  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      await updatePricingSettings(pricingSettings);
      alert('Precios actualizados correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar precios.');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    try {
      await updateLocationSettings(locationSettings);
      alert('Ubicación actualizada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar ubicación.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSaveTerms = async () => {
    setSavingTerms(true);
    try {
      await updateTermsSettings(termsSettings);
      alert('Términos y condiciones actualizados.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar términos.');
    } finally {
      setSavingTerms(false);
    }
  };

  // --- GENERADOR DE PREVIEW (Cliente) ---
  const generatePreview = () => {
    let preview = termsSettings.template || "";
    
    // Reemplazo dinámico con los valores ACTUALES del estado
    // Esto cumple tu requerimiento: "Ver reflejados los cambios si las variables fueron usadas"
    preview = preview
      .replace(/{HOURLY_RATE}/g, `$${pricingSettings.hourlyRate} MXN`)
      .replace(/{FULL_REFUND_HOURS}/g, String(pricingSettings.cancellationPolicy.fullRefund))
      .replace(/{PARTIAL_REFUND_HOURS}/g, String(pricingSettings.cancellationPolicy.partialRefund))
      .replace(/{PARTIAL_REFUND_PERCENTAGE}/g, `${pricingSettings.cancellationPolicy.partialRefundPercentage}%`)
      .replace(/{LOCATION_NAME}/g, locationSettings.name)
      .replace(/{LOCATION_ADDRESS}/g, locationSettings.address)
      .replace(/{CAPACITY}/g, `${locationSettings.capacity} personas`)
      // ← CORREGIDO: Ahora usa wifiSettings del backend
      .replace(/{WIFI_NETWORK}/g, wifiSettings.wifiName || "Invitados");
    
    // Lista de paquetes
    const packagesList = pricingSettings.packages
      .map(pkg => `${pkg.name}: $${pkg.price} MXN (${pkg.hours} horas)`)
      .join(', ');
    preview = preview.replace(/{PACKAGES_LIST}/g, packagesList || 'Consultar en recepción');
    
    if (termsSettings.additionalClauses?.trim()) {
      preview += '\n\n**Cláusulas Adicionales:**\n' + termsSettings.additionalClauses;
    }
    
    return preview;
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('termsTemplate') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = termsSettings.template;
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      setTermsSettings(prev => ({ ...prev, template: newText }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // --- RENDERIZADORES ---

  const renderPricingSettings = () => {
    const updatePackage = (id: number, field: string, value: any) => {
      setPricingSettings(prev => ({
        ...prev,
        packages: prev.packages.map(pkg =>
          pkg.id === id ? { ...pkg, [field]: value } : pkg
        )
      }));
    };

    const addPackage = () => {
        // Generamos un ID temporal negativo para identificar nuevos (opcional, el back lo ignora y crea nuevos)
      const newId = Math.random(); 
      setPricingSettings(prev => ({
        ...prev,
        packages: [...prev.packages, {
          id: newId, name: 'Nuevo Paquete', hours: 1, price: 200, discount: 0
        }]
      }));
    };

    const removePackage = (id: number) => {
      setPricingSettings(prev => ({
        ...prev,
        packages: prev.packages.filter(pkg => pkg.id !== id)
      }));
    };

    return (
      <div className="space-y-8 pb-10">
        {/* Sección Tarifa Base */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Tarifa Base</h3>
          <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-300 mb-1">
                Precio por hora (MXN)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="hourlyRate"
                  value={pricingSettings.hourlyRate}
                  onChange={e => setPricingSettings(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  className="bg-zinc-900 block w-full pl-10 pr-12 py-2 rounded-md border border-zinc-700 focus:ring-purple-500 focus:border-purple-500 text-white"
                />
              </div>
          </div>
        </div>

        {/* Sección Paquetes */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Paquetes con Descuento</h3>
            <button type="button" onClick={addPackage} className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
              <PlusIcon className="h-4 w-4 mr-1" /> Agregar
            </button>
          </div>
          <div className="space-y-4">
            {pricingSettings.packages.map(pkg => (
              <div key={pkg.id} className="bg-zinc-900 p-4 rounded-md border border-zinc-700">
                <div className="flex justify-between items-center mb-3">
                  <input
                      type="text"
                      value={pkg.name}
                      onChange={e => updatePackage(pkg.id!, 'name', e.target.value)}
                      className="bg-zinc-800 w-full py-1 px-2 rounded-md border border-zinc-700 text-white text-sm"
                      placeholder="Nombre del paquete"
                    />
                  <button type="button" onClick={() => removePackage(pkg.id!)} className="ml-2 text-red-400 hover:text-red-300">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400">Horas</label>
                    <input type="number" value={pkg.hours} onChange={e => updatePackage(pkg.id!, 'hours', Number(e.target.value))} className="bg-zinc-800 w-full py-1 px-2 rounded-md border border-zinc-700 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Precio (MXN) </label>
                    <input type="number" value={pkg.price} onChange={e => updatePackage(pkg.id!, 'price', Number(e.target.value))} className="bg-zinc-800 w-full py-1 px-2 rounded-md border border-zinc-700 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Descuento (%)</label>
                    <input type="number" value={pkg.discount} onChange={e => updatePackage(pkg.id!, 'discount', Number(e.target.value))} className="bg-zinc-800 w-full py-1 px-2 rounded-md border border-zinc-700 text-white text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección Políticas */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Política de Cancelación</h3>
          <div className="space-y-4">
             {/* ... Inputs de politicas ... (puedes mantener los mismos inputs del codigo original) */}
             <div>
               <label className="block text-sm text-gray-300 mb-1">Reembolso 100% (horas antes)</label>
               <input type="number" value={pricingSettings.cancellationPolicy.fullRefund} onChange={e => setPricingSettings(prev => ({...prev, cancellationPolicy: {...prev.cancellationPolicy, fullRefund: Number(e.target.value)}}))} className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-700 text-white"/>
             </div>
             <div>
               <label className="block text-sm text-gray-300 mb-1">Reembolso Parcial (horas antes)</label>
               <input type="number" value={pricingSettings.cancellationPolicy.partialRefund} onChange={e => setPricingSettings(prev => ({...prev, cancellationPolicy: {...prev.cancellationPolicy, partialRefund: Number(e.target.value)}}))} className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-700 text-white"/>
             </div>
             <div>
               <label className="block text-sm text-gray-300 mb-1">% Reembolso Parcial</label>
               <input type="number" value={pricingSettings.cancellationPolicy.partialRefundPercentage} onChange={e => setPricingSettings(prev => ({...prev, cancellationPolicy: {...prev.cancellationPolicy, partialRefundPercentage: Number(e.target.value)}}))} className="bg-zinc-900 w-full py-2 px-3 rounded-md border border-zinc-700 text-white"/>
             </div>
          </div>
        </div>

        {/* BOTÓN DE GUARDADO ESPECÍFICO DE PRECIOS */}
        <div className="flex justify-end pt-4">
           <button
            onClick={handleSavePricing}
            disabled={savingPricing}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {savingPricing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <SaveIcon className="mr-2 h-4 w-4"/>}
            Guardar Configuración de Precios
          </button>
        </div>
      </div>
    );
  };

  const renderResourcesSettings = () => {
    return (
      <div className="space-y-8 pb-10">
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Configuración Wi-Fi</h3>
          <p className="text-sm text-gray-400 mb-6">
            Esta información se utiliza para la variable {"{WIFI_NETWORK}"} en tus Términos y Condiciones.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="networkName" className="block text-sm font-medium text-gray-300 mb-1">
                Nombre de Red (SSID)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <WifiIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="networkName"
                  value={wifiSettings.wifiName}
                  onChange={e => setWifiSettings(prev => ({
                    ...prev,
                    wifiName: e.target.value
                  }))}
                  className="bg-zinc-900 block w-full pl-10 py-2 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: SPEC.MEET_Guest"
                />
              </div>
            </div>
            <div>
              <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                type="text"
                id="wifiPassword"
                value={wifiSettings.wifiPassword}
                onChange={e => setWifiSettings(prev => ({
                  ...prev,
                  wifiPassword: e.target.value
                }))}
                className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="Contraseña de la red (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Botón de guardado para Wi-Fi */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveWifi}
            disabled={savingWifi}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {savingWifi ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <SaveIcon className="mr-2 h-4 w-4"/>}
            Guardar Wi-Fi
          </button>
        </div>
      </div>
    );
  };

  const renderTermsSettings = () => {
    return (
      <div className="space-y-8 pb-10">
        <div className="bg-zinc-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Editor de Plantilla T&C</h3>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-3 py-1 border border-zinc-600 text-sm rounded-md text-white hover:bg-zinc-700"
            >
              {showPreview ? <Code className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showPreview ? 'Editar' : 'Vista Previa'}
            </button>
          </div>

          {!showPreview ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Variables dinámicas disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.map(variable => (
                    <button
                      key={variable.key}
                      type="button"
                      onClick={() => insertVariable(variable.key)}
                      className="inline-flex items-center px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                      title={variable.label}
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      {variable.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="termsTemplate"
                rows={15}
                value={termsSettings.template}
                onChange={e => setTermsSettings(prev => ({ ...prev, template: e.target.value }))}
                className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white font-mono text-sm"
              />
            </>
          ) : (
            <div className="bg-zinc-900 p-4 rounded-md border border-zinc-700">
              <h4 className="font-medium text-white mb-3">Así lo verá el usuario:</h4>
              <div className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                {generatePreview()}
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN REINTEGRADA: Cláusulas Adicionales */}
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Cláusulas Adicionales</h3>
          <p className="text-sm text-gray-400 mb-3">
            Este texto se añadirá automáticamente al final de los términos principales.
          </p>
          <textarea
            rows={5}
            value={termsSettings.additionalClauses}
            onChange={e => setTermsSettings(prev => ({ ...prev, additionalClauses: e.target.value }))}
            className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white text-sm"
            placeholder="Ej: Políticas de uso de equipo de cómputo, conducta, etc."
          />
        </div>

         {/* BOTÓN DE GUARDADO ESPECÍFICO DE TÉRMINOS */}
         <div className="flex justify-end pt-4">
           <button
            onClick={handleSaveTerms}
            disabled={savingTerms}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {savingTerms ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <SaveIcon className="mr-2 h-4 w-4"/>}
            Guardar Términos y Condiciones
          </button>
        </div>
      </div>
    );
  };

  const renderLocationSettings = () => {
    const updateOpeningHours = (day: string, field: string, value: any) => {
        // Lógica segura para actualizar un objeto anidado
        setLocationSettings(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: {
                    ...(prev.openingHours[day] || {open: '09:00', close: '19:00', closed: false}), // fallback
                    [field]: value
                }
            }
        }));
    };

    // Aseguramos que existan días para iterar si viene vacío
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <div className="space-y-8 pb-10">
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Información de la Ubicación</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Sala</label>
              <input type="text" value={locationSettings.name} onChange={e => setLocationSettings(prev => ({ ...prev, name: e.target.value }))} className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Dirección</label>
              <input type="text" value={locationSettings.address} onChange={e => setLocationSettings(prev => ({ ...prev, address: e.target.value }))} className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Capacidad</label>
              <input type="number" value={locationSettings.capacity} onChange={e => setLocationSettings(prev => ({ ...prev, capacity: Number(e.target.value) }))} className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instrucciones de Acceso</label>
              <textarea rows={3} value={locationSettings.accessInstructions} onChange={e => setLocationSettings(prev => ({ ...prev, accessInstructions: e.target.value }))} className="bg-zinc-900 block w-full py-2 px-3 rounded-md border border-zinc-700 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Horario de Operación</h3>
             <div className="space-y-3">
            {days.map((day) => {
                const hours = locationSettings.openingHours?.[day] || { open: '09:00', close: '19:00', closed: false };
                return (
              <div key={day} className="flex items-center justify-between bg-zinc-900 p-3 rounded-md">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={e => updateOpeningHours(day, 'closed', !e.target.checked)}
                    className="h-4 w-4 text-purple-600 rounded bg-zinc-800 border-zinc-600"
                  />
                  <label className="ml-2 text-white capitalize w-24">{day}</label>
                </div>
                {!hours.closed && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={hours.open} onChange={e => updateOpeningHours(day, 'open', e.target.value)} className="bg-zinc-800 py-1 px-2 rounded border border-zinc-700 text-white text-sm" />
                    <span className="text-gray-400">a</span>
                    <input type="time" value={hours.close} onChange={e => updateOpeningHours(day, 'close', e.target.value)} className="bg-zinc-800 py-1 px-2 rounded border border-zinc-700 text-white text-sm" />
                  </div>
                )}
                {hours.closed && <span className="text-gray-400 text-sm">Cerrado</span>}
              </div>
            )})} 
          </div>
        </div>

        {/* BOTÓN DE GUARDADO ESPECÍFICO DE UBICACIÓN */}
        <div className="flex justify-end pt-4">
           <button
            onClick={handleSaveLocation}
            disabled={savingLocation}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {savingLocation ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <SaveIcon className="mr-2 h-4 w-4"/>}
            Guardar Ubicación
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pricing': return renderPricingSettings();
      case 'resources': return renderResourcesSettings();
      case 'terms': return renderTermsSettings();
      case 'location': return renderLocationSettings();
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Configuración del Sistema</h1>
        {/* Se eliminó el botón "Guardar Global" de aquí */}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden sticky top-4">
            <nav className="flex flex-col">
              <button onClick={() => setActiveTab('pricing')} className={`px-6 py-3 text-left text-sm font-medium transition-colors ${activeTab === 'pricing' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-zinc-800'}`}>
                <div className="flex items-center"><DollarSignIcon className="h-5 w-5 mr-2" /> Precios y Paquetes</div>
              </button>
              <button onClick={() => setActiveTab('resources')} className={`px-6 py-3 text-left text-sm font-medium transition-colors ${activeTab === 'resources' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-zinc-800'}`}>
                <div className="flex items-center"><WifiIcon className="h-5 w-5 mr-2" /> Configuración Wi-Fi</div>
              </button>
              <button onClick={() => setActiveTab('terms')} className={`px-6 py-3 text-left text-sm font-medium transition-colors ${activeTab === 'terms' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-zinc-800'}`}>
                 <div className="flex items-center"><FileTextIcon className="h-5 w-5 mr-2" /> Términos y Condiciones</div>
              </button>
              <button onClick={() => setActiveTab('location')} className={`px-6 py-3 text-left text-sm font-medium transition-colors ${activeTab === 'location' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-zinc-800'}`}>
                 <div className="flex items-center"><MapPinIcon className="h-5 w-5 mr-2" /> Ubicación y Horarios</div>
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1">
            {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;