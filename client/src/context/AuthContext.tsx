import React, { useEffect, useState, createContext, useContext } from 'react';
import api from '../api/axios';
import { AxiosError } from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role:'ADMIN' | 'CLIENT';
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;         
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/verify');
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth()
  }, []);
  // Login function connected to backend
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
  setIsLoading(true);
  try {
    const response = await api.post('/auth/login', { 
      email, 
      password,
      rememberMe
     });

    const { user: userData } = response.data;
    setUser(userData);
    return userData; 

} catch (error) {
    const axiosError = error as AxiosError<{error: string}>;
    throw new Error(axiosError.response?.data?.error || 'Credenciales inválidas');
  } finally {
    setIsLoading(false);
  }
};
  // Register function connected to backend
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      await login(email, password);
    } catch (error) {
      let message = 'Error al registrar al usuario';
      if(error instanceof AxiosError){
        message = error.response?.data?.console.error || 'Error al registrar el usuario';
      }
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error){
      console.error("Error al cerrar sesion en el servidor")
    } finally {
      setUser(null);
    }
  };

  // Context value
  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN'
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};