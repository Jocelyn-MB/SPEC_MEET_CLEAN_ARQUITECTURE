import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleReservaClick = () => {
    if (isAuthenticated) {
      navigate('/booking');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section - La imagen de fondo viene del Layout */}
      <section className="relative text-white h-screen">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            onClick={handleReservaClick}
            className="font-makron text-white py-4 px-10 text-2xl transition-all hover:bg-white hover:bg-opacity-30 border border-white font-normal rounded-full bg-white bg-opacity-15 backdrop-blur-sm hover:scale-105 transform"
          >
            RESERVAR
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;