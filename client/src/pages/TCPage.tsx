import api from '../api/axios'; // Tu instancia de axios configurada
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { type PricingSettings,type LocationSettings, type TermsSettings } from '../api/settings.api';

const TCPage: React.FC = () => {
  const [data, setData] = useState<{
    terms: TermsSettings;
    pricing: PricingSettings;
    location: LocationSettings;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllConfig = async () => {
      try {
        setLoading(true);
        // Traemos toda la configuración necesaria para llenar las variables
        const [termsRes, pricingRes, locationRes] = await Promise.all([
          api.get('/admin/settings/terms'),
          api.get('/admin/settings/pricing'),
          api.get('/admin/settings/location')
        ]);

        setData({
          terms: termsRes.data,
          pricing: pricingRes.data,
          location: locationRes.data
        });
      } catch (err) {
        console.error('Error al cargar términos:', err);
        setError('No se pudo cargar la información legal. Por favor, intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadAllConfig();
  }, []);

  /**
   * Función que procesa la plantilla y reemplaza todas las etiquetas dinámicas
   */
  const renderProcessedTemplate = (template: string) => {
    if (!data) return template;

    // Generar texto de paquetes
    const packagesList = data.pricing.packages && data.pricing.packages.length > 0
      ? data.pricing.packages
          .map(pkg => `${pkg.name} ($${pkg.price} MXN por ${pkg.hours}h)`)
          .join(', ')
      : 'Consultar paquetes vigentes en recepción';

    return template
      .replace(/{HOURLY_RATE}/g, `$${data.pricing.hourlyRate} MXN`)
      .replace(/{LOCATION_NAME}/g, data.location.name)
      .replace(/{LOCATION_ADDRESS}/g, data.location.address)
      .replace(/{CAPACITY}/g, `${data.location.capacity} personas`)
      .replace(/{WIFI_NETWORK}/g, data.location.name || 'Red Privada') 
      .replace(/{PACKAGES_LIST}/g, packagesList)
      .replace(/{FULL_REFUND_HOURS}/g, String(data.pricing.cancellationPolicy.fullRefund))
      .replace(/{PARTIAL_REFUND_HOURS}/g, String(data.pricing.cancellationPolicy.partialRefund))
      .replace(/{PARTIAL_REFUND_PERCENTAGE}/g, `${data.pricing.cancellationPolicy.partialRefundPercentage}%`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 animate-pulse">Cargando términos y condiciones...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white px-4">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-purple-600 underline"> Reintentar </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header Estilizado */}
      <div className="max-w-4xl mx-auto pt-16 pb-8 px-6 border-b border-gray-100">
        <h1 className="text-3xl font-light text-center text-gray-900 tracking-tight">
          TÉRMINOS Y CONDICIONES DE SERVICIO.MEET
        </h1>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-purple max-w-none">
          
          {/* Plantilla procesada con variables */}
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
            {renderProcessedTemplate(data.terms.template)}
          </div>

          {/* Integración de Cláusulas Adicionales */}
          {data.terms.additionalClauses && (
            <div className="mt-12 pt-12 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wider">
                Disposiciones Complementarias
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px] bg-gray-50 p-6 rounded-xl border border-gray-100">
                {data.terms.additionalClauses}
              </div>
            </div>
          )}

          {/* Opciones de Privacidad Dinámicas */}
          
        </div>

        {/* Footer de la página */}
      
      </div>
    </div>
  );
};

export default TCPage;