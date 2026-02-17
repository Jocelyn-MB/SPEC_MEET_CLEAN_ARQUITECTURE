import React, { useState } from 'react';
const GalleryPage: React.FC = () => {
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
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
        {galleryImages.map(image => <div key={image.id} className="bg-zinc-900 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openImageModal(image.url)}>
            <div className="relative">
              <img src={image.url} alt="Imagen de sala de juntas" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src="/logotipo_editable-02.png" alt="" className="w-24 opacity-30" />
              </div>
            </div>
          </div>)}
      </div>
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
export default GalleryPage;