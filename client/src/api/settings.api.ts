import api from './axios';

// --- Interfaces (Tipos) ---

export interface PricingSettings {
  hourlyRate: number;
  packages: {
    id?: number;
    name: string;
    hours: number;
    price: number;
    discount: number;
  }[];
  cancellationPolicy: {
    fullRefund: number;
    partialRefund: number;
    partialRefundPercentage: number;
  };
}

export interface LocationSettings {
  name: string;
  address: string;
  openingHours: any; // JSON Object
  capacity: number;
  accessInstructions: string;
}

export interface TermsSettings {
  template: string;
  additionalClauses: string;
  privacyOptions: {
    collectEmail: boolean;
    shareData: boolean;
    cctvNotice: boolean;
    cookieConsent: boolean;
  };
}

export interface WifiSettings {
  wifiName: string;
  wifiPassword: string;
}

// --- Endpoints de Precios ---
export const getPricingSettings = async () => {
  return await api.get('/admin/settings/pricing');
};

export const updatePricingSettings = async (data: PricingSettings) => {
  return await api.put('/admin/settings/pricing', data);
};

// --- Endpoints de Ubicación ---
export const getLocationSettings = async () => {
  return await api.get('/admin/settings/location');
};

export const updateLocationSettings = async (data: LocationSettings) => {
  return await api.put('/admin/settings/location', data);
};

// --- Endpoints de Términos ---
export const getTermsSettings = async () => {
  return await api.get('/admin/settings/terms');
};

export const updateTermsSettings = async (data: TermsSettings) => {
  return await api.put('/admin/settings/terms', data);
};
// --- Endpoints de Wi-Fi ---
export const getWifiSettings = async () => {
  return await api.get('/admin/settings/wifi');
};

export const updateWifiSettings = async (data: WifiSettings) => {
  return await api.put('/admin/settings/wifi', data);
};