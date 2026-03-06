import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from 'lucide-react';
const FeaturesPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const galleryImages = [{
    id: 1,
    url: "/PHOTO-2025-02-03-12-44-42.jpg"
  }, {
    id: 2,
    url: "/PHOTO-2025-02-03-12-44-43.jpg"
  }];
  const openImageModal = (url: string) => {
    setSelectedImage(url);
  };
  const closeImageModal = () => {
    setSelectedImage(null);
  };
  return <div className="w-full">
      {/* Room Preview Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black/90">
              Tu sala de juntas y reuniones
            </h2>
            <p className="text-accent max-w-2xl mx-auto">
              Un ambiente sofisticado y tecnológico para tus reuniones,
              videollamadas, capacitaciones o eventos privados.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-lg overflow-hidden">
              <img src="/PHOTO-2025-02-03-12-44-43.jpg" alt="Sala de juntas moderna" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-6 text-black/90">
                Características de la sala
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Capacidad para 8 personas con mesa de juntas ejecutiva
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Smart TV 4K de 55" con conexiones HDMI y inalámbricas
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Sistema de videoconferencia con cámara HD y micrófono
                    omnidireccional
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Internet de alta velocidad con Wi-Fi dedicado
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Pizarra digital interactiva
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Sistema de control de clima
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-accent">
                    Servicio de bebidas y amenidades disponibles
                  </span>
                </li>
              </ul>
              <Link to="/booking" className="bg-background hover:bg-background/80 text-white font-medium py-3 px-6 rounded-md transition-all mt-8 text-center md:self-start">
                Reservar Ahora
              </Link>
            </div>
          </div>
          {/* Gallery Section */}
          <div className="mt-16">
            <div className="text-center mb-10"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {galleryImages.map(image => <div key={image.id} className="bg-zinc-900 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openImageModal(image.url)}>
                  <div className="relative">
                    <img src={image.url} alt="Imagen de sala de juntas" className="w-full h-64 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img src="/logotipo_editable-02.png" alt="" className="w-24 opacity-30" />
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </section>
      {/* Image Modal */}
      {selectedImage && <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closeImageModal}>
          <div className="max-w-4xl w-full max-h-screen relative">
            <div className="relative">
              <img src={selectedImage} alt="Vista ampliada" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src="/logotipo_editable-02.png" alt="" className="w-32 opacity-20" />
              </div>
            </div>
            <button className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70" onClick={e => {
          e.stopPropagation();
          closeImageModal();
        }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>}
    </div>;
};
export default FeaturesPage;