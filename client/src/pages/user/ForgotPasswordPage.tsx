import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios'; // Importamos tu instancia de axios configurada
import { AtSignIcon, ArrowRightIcon, ArrowLeftIcon, MailIcon } from 'lucide-react';
import { AxiosError } from 'axios';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // Para el mensaje de éxito (verde)
  const [error, setError] = useState('');     // Para el mensaje de error (rojo)
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Llamamos al endpoint que creamos en el backend
      const response = await api.post('/auth/forgot-password', { email });
      
      // Si todo sale bien, mostramos el mensaje del servidor
      setMessage(response.data.message || 'Si el correo existe, recibirás un enlace.');
      
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || 'Error al conectar con el servidor');
      } else {
        setError('Ha ocurrido un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* FONDO (Exactamente el mismo del Login) */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{
          backgroundImage: "url('https://uploadthingy.s3.us-west-1.amazonaws.com/mnx4A3B36Dy2nyF5i8QPC8/PHOTO-2025-02-03-12-44-43.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      >
        {/* Overlay opcional para oscurecer un poco si el texto no se lee bien, 
            aunque tu tarjeta ya tiene blur */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* TARJETA (Mismos estilos Glassmorphism) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <MailIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Recuperar Cuenta</h2>
            <p className="mt-2 text-white/80 text-sm">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {/* MENSAJES DE ALERTA */}
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 text-sm text-center">
              {message}
            </div>
          )}

          {/* Si ya hay mensaje de éxito, ocultamos el formulario para que no reenvíen por error */}
          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSignIcon className="h-5 w-5 text-white/40" />
                  </div>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    autoComplete="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl shadow-sm bg-black/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all" 
                    placeholder="correo@ejemplo.com" 
                  />
                </div>
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Enviando...' : (
                    <>
                      Enviar Enlace
                      <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Botón extra para regresar cuando ya se envió el correo */
            <div className="text-center">
                <p className="text-white/60 text-sm mb-4">Revisa tu bandeja de entrada (y spam).</p>
            </div>
          )}

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <Link to="/login" className="inline-flex items-center font-medium text-gray-400 hover:text-white transition-colors">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Volver al Iniciar Sesión
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;