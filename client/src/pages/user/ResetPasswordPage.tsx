import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { LockIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, CheckCircleIcon } from 'lucide-react';
import { AxiosError } from 'axios';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 👇 AQUÍ CAPTURAMOS EL TOKEN DE LA URL
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validaciones simples
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Enviamos el token y la nueva contraseña al backend
      const response = await api.post(`/auth/reset-password/${token}`, { 
        newPassword: password 
      });

      setMessage(response.data.message);
      
      // Redirigir al Login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || 'El enlace es inválido o ha expirado.');
      } else {
        setError('Ha ocurrido un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* FONDO */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{
          backgroundImage: "url('https://uploadthingy.s3.us-west-1.amazonaws.com/mnx4A3B36Dy2nyF5i8QPC8/PHOTO-2025-02-03-12-44-43.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <LockIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Nueva Contraseña</h2>
            <p className="mt-2 text-white/80 text-sm">
              Ingresa tu nueva contraseña para recuperar el acceso.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 text-sm text-center flex flex-col items-center">
              <CheckCircleIcon className="h-8 w-8 mb-2 text-green-400" />
              <p>{message}</p>
              <p className="text-xs mt-2 text-green-300/70">Redirigiendo al login...</p>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* INPUT: NUEVA CONTRASEÑA */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-white/40" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-white/10 rounded-xl shadow-sm bg-black/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all" 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* INPUT: CONFIRMAR CONTRASEÑA */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircleIcon className="h-5 w-5 text-white/40" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl shadow-sm bg-black/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <div>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Actualizando...' : (
                    <>
                      Cambiar Contraseña
                      <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;