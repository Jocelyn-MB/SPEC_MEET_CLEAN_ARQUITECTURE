import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MenuIcon, XIcon, UserIcon, CalendarIcon, SettingsIcon, LogOutIcon, HomeIcon, InfoIcon, TagIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determinar si estamos en páginas con imagen de fondo
  const pagesWithImageBackground = ['/', '/booking', '/dashboard','/login','/register',];
  const hasImageBackground = pagesWithImageBackground.includes(location.pathname);

  
  // Navbar transparente en páginas con imagen sin scroll, sólido después de scroll o en otras páginas
  const navbarClasses = hasImageBackground && !scrolled
    ? 'bg-transparent border-transparent'
    : 'bg-background/60 backdrop-blur-md border-transparent';

  return <nav className={`${navbarClasses} border-b sticky top-0 z-50 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center ">
            <Link to="/" className="flex-shrink-0">
            <div className='h-10 w-40 relative overflow-hidden flex items-center -ml-6'>
              <img src="/MEET.svg" alt=".MEET" className="h-25 w-auto object-contain brightness-0 invert hover:opacity-80" />
            </div>
            </Link>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:opacity-80 hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
          <div className="hidden md:block">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:opacity-80 hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile and desktop menu (same content) */}
      {isMenuOpen && <div className="bg-zinc-900/95 backdrop-blur-md shadow-lg absolute right-0 z-50 w-64 py-2 border border-zinc-800 rounded-b-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
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

            {/* --- LÓGICA DE USUARIO --- */}
            {isAuthenticated ? (
              <>
                {/* 1. MI PANEL (Siempre visible si estás logueado) */}
                <Link to="/dashboard" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-5 w-5" />
                      Mi Panel
                    </div>
                </Link>

                {/* 2. PANEL ADMIN (Solo visible si eres Admin) */}
                {isAdmin && (
                  <Link to="/admin" className="text-purple-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center">
                      <SettingsIcon className="mr-2 h-5 w-5" />
                      Panel Admin
                    </div>
                  </Link>
                )}

                <Link to="/booking" className="text-gray-300 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Reservar
                  </div>
                </Link>

                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }} 
                  className="text-red-400 hover:bg-zinc-800 hover:text-red-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                >
                  <div className="flex items-center">
                    <LogOutIcon className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* --- LÓGICA VISITANTE --- */}
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
              </>
            )}
          </div>
        </div>
      }
    </nav>
};

export default Navbar;