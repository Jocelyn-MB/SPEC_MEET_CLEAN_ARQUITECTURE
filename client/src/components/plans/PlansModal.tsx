import React from 'react';
import { Link } from 'react-router-dom';
import { XIcon } from 'lucide-react';
interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const PlansModal: React.FC<PlansModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  // Mock data for plans - in a real app, this would come from an API
  const plans = [{
    id: 1,
    name: 'Plan Básico',
    hours: 1,
    price: 200,
    pricePerHour: 200,
    discount: 0
  }, {
    id: 2,
    name: 'Paquete 5 horas',
    hours: 5,
    price: 900,
    pricePerHour: 180,
    discount: 10,
    popular: true
  }, {
    id: 3,
    name: 'Paquete 10 horas',
    hours: 10,
    price: 1700,
    pricePerHour: 170,
    discount: 15
  }];
  return <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-zinc-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button type="button" className="text-gray-400 hover:text-white" onClick={onClose}>
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="text-center mb-8">
              <h3 className="text-2xl leading-6 font-bold text-white" id="modal-title">
                Elige tu Plan
              </h3>
              <p className="mt-2 text-gray-400">
                Comienza con el plan que mejor se adapte a tus necesidades
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => <div key={plan.id} className={`bg-zinc-800 rounded-lg p-6 ${plan.popular ? 'border-2 border-purple-500' : 'border border-zinc-700'} relative`}>
                  {plan.popular && <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 transform translate-x-2 -translate-y-2 rounded-bl-lg rounded-tr-lg">
                      RECOMENDADO
                    </div>}
                  <h3 className="text-lg font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline mt-2 mb-4">
                    <span className="text-3xl font-extrabold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-400 ml-1">MXN</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    {plan.hours} horas | ${plan.pricePerHour}/hora
                    {plan.discount > 0 && <span className="ml-2 text-purple-400">
                        ({plan.discount}% ahorro)
                      </span>}
                  </p>
                  <Link to="/booking" onClick={onClose} className={`block w-full py-2 px-3 rounded-md shadow text-center text-sm font-medium ${plan.popular ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                    Seleccionar
                  </Link>
                </div>)}
            </div>
            <div className="mt-8 text-center">
              <Link to="/plans" onClick={onClose} className="text-purple-400 hover:text-purple-300 font-medium">
                Ver todos los detalles de los planes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default PlansModal;