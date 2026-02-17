import React from 'react';
import {  useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const LandingPage: React.FC = () => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const handleReservaClick = () => {
    if (isAuthenticated) {
      navigate('/booking');
    } else {
      navigate('/login');
    }
  };
  return <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-black text-white h-screen">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{
        backgroundImage: "url('https://uploadthingy.s3.us-west-1.amazonaws.com/mnx4A3B36Dy2nyF5i8QPC8/PHOTO-2025-02-03-12-44-43.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
      }}></div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button onClick={handleReservaClick} className="text-white py-4 px-10 text-2xl transition-all hover:bg-white hover:bg-opacity-30 border border-white font-normal rounded-full bg-white bg-opacity-15 backdrop-blur-sm">
            RESERVAR
          </button>
        </div>
      </section>
    </div>;
};
export default LandingPage;