import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MenuIcon, XIcon, UserIcon, CalendarIcon, SettingsIcon, LogOutIcon, HomeIcon, InfoIcon, TagIcon } from 'lucide-react';
const Navbar: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img src="/logotipo.png" alt="SPEC.MEET" className="h-10" />
            </Link>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
          <div className="hidden md:block">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile and desktop menu (same content) */}
      {isMenuOpen && <div className="bg-zinc-900 shadow-lg absolute right-0 z-50 w-64 py-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-zinc-900">
            <Link to="/" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center">
                <HomeIcon className="mr-2 h-5 w-5" />
                Inicio
              </div>
            </Link>
            <Link to="/features" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center">
                <InfoIcon className="mr-2 h-5 w-5" />
                Características
              </div>
            </Link>
            <Link to="/plans" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center">
                <TagIcon className="mr-2 h-5 w-5" />
                Planes
              </div>
            </Link>
            {isAuthenticated ? <>
                {isAdmin ? <Link to="/admin" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center">
                      <SettingsIcon className="mr-2 h-5 w-5" />
                      Panel Admin
                    </div>
                  </Link> : <Link to="/dashboard" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-5 w-5" />
                      Mi Panel
                    </div>
                  </Link>}
                <Link to="/booking" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Reservar
                  </div>
                </Link>
                <button onClick={() => {
            handleLogout();
            setIsMenuOpen(false);
          }} className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                  <div className="flex items-center">
                    <LogOutIcon className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </div>
                </button>
              </> : <>
                <Link to="/login" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    Iniciar Sesión
                  </div>
                </Link>
                <Link to="/register" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    Registrarse
                  </div>
                </Link>
              </>}
          </div>
        </div>}
    </nav>;
};
export default Navbar;