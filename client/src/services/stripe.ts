// Este es un archivo de ejemplo que muestra cómo se integraría Stripe
import { loadStripe } from '@stripe/stripe-js';
// Publicar solo la clave pública en el frontend
const stripePromise = loadStripe('pk_test_TU_CLAVE_PUBLICA_DE_STRIPE');
export const createPaymentSession = async bookingData => {
  try {
    // Esta llamada debe ir a tu backend, nunca directamente a Stripe desde el frontend
    const response = await fetch('/api/create-payment-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingDetails: bookingData
      })
    });
    const session = await response.json();
    // Redirigir al checkout de Stripe o usar Stripe Elements
    const stripe = await stripePromise;
    const result = await stripe.redirectToCheckout({
      sessionId: session.id
    });
    if (result.error) {
      console.error(result.error.message);
    }
  } catch (error) {
    console.error('Error al procesar el pago:', error);
  }
};
export const getPaymentStatus = async sessionId => {
  try {
    const response = await fetch(`/api/payment-status/${sessionId}`);
    return await response.json();
  } catch (error) {
    console.error('Error al verificar el estado del pago:', error);
    return {
      status: 'error'
    };
  }
};