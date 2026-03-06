import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Páginas con imagen de fondo
  const pagesWithImageBackground = ['/', '/booking', '/dashboard','/login','/register'];
  const hasImageBackground = pagesWithImageBackground.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen text-white relative">
      {/* Imagen de fondo (solo en páginas específicas) */}
      {hasImageBackground && (
        <div 
          className="fixed inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: "url('https://uploadthingy.s3.us-west-1.amazonaws.com/mnx4A3B36Dy2nyF5i8QPC8/PHOTO-2025-02-03-12-44-43.jpg')",
            backgroundAttachment: 'fixed' // Parallax effect
          }}
        />
      )}
      
      {/* Overlay oscuro para mejorar legibilidad del contenido
      {hasImageBackground && (
        <div className="fixed inset-0 bg-black/40 z-0" />
      )}*/}
      
      {/* Fondo blanco para páginas admin */}
      {!hasImageBackground && (
        <div className="fixed inset-0 bg-white z-0" />
      )}
      
      {/* Contenido (relativo al fondo) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;