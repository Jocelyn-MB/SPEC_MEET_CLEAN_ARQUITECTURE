import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from 'lucide-react';
const PlansPage: React.FC = () => {
  // Mock data for plans - in a real app, this would come from an API
  const [plans] = useState([{
    id: 1,
    name: 'Plan Básico',
    hours: 1,
    price: 200,
    pricePerHour: 200,
    discount: 0,
    features: ['Acceso a sala de juntas', 'Wi-Fi de alta velocidad', 'Equipamiento audiovisual', 'Café incluido']
  }, {
    id: 2,
    name: 'Paquete 5 horas',
    hours: 5,
    price: 900,
    pricePerHour: 180,
    discount: 10,
    popular: true,
    features: ['Acceso a sala de juntas', 'Wi-Fi de alta velocidad', 'Equipamiento audiovisual', 'Café y agua incluidos', 'Cancelación gratuita con 24h de antelación']
  }, {
    id: 3,
    name: 'Paquete 10 horas',
    hours: 10,
    price: 1700,
    pricePerHour: 170,
    discount: 15,
    features: ['Acceso a sala de juntas', 'Wi-Fi de alta velocidad', 'Equipamiento audiovisual completo', 'Café, agua y refrigerios incluidos', 'Cancelación gratuita con 24h de antelación', 'Soporte técnico prioritario']
  }]);
  return <div className="w-full min-h-screen bg-gradient-to-b from-white to-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black/90 mb-4">
            Nuestros Planes
          </h1>
          <p className="font-custom text-xl text-background max-w-3xl mx-auto">
            Selecciona el plan que mejor se adapte a tus necesidades de
            reuniones y presentaciones
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {plans.map(plan => <div key={plan.id} className={`bg-black rounded-lg shadow-lg overflow-hidden border ${plan.popular ? 'border-secondary' : 'border-zinc-700'} relative`}>
              {plan.popular && <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MÁS POPULAR
                </div>}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">MXN</span>
                </div>
                <p className="text-gray-400 mb-6">
                  {plan.hours} horas | ${plan.pricePerHour}/hora
                  {plan.discount > 0 && <span className="ml-2 text-secondary text-sm">
                      ({plan.discount}% ahorro)
                    </span>}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>)}
                </ul>
                <Link to="/booking" className={`block w-full py-3 px-4 rounded-md shadow text-center font-medium ${plan.popular ? 'bg-accent hover:bg-accent/90 text-white' : 'bg-background hover:bg-background/90 text-white'}`}>
                  Reservar Ahora
                </Link>
              </div>
            </div>)}
        </div>
        <div className="mt-16 bg-zinc-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4">
            ¿Necesitas un plan personalizado?
          </h2>
          <p className="text-gray-300 mb-6">
            Si ninguno de nuestros planes estándar se adapta a tus necesidades,
            podemos crear un plan personalizado para ti o tu empresa.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact" className="inline-flex items-center px-6 py-3 border border-gray-700 text-base font-medium rounded-md shadow-sm text-white bg-zinc-700 hover:bg-zinc-600">
              Contáctanos
            </Link>
          </div>
        </div>
      </div>
    </div>;
};
export default PlansPage;