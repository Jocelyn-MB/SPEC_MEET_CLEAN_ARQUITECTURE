import React from 'react';
import { Link } from 'react-router-dom';
const Footer: React.FC = () => {
  return <footer className="bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <img src="/logotipo_editable-02.png" alt="SPEC" className="h-8" />
            </div>
            <p className="text-gray-400 text-sm">
              La solución integral para la gestión inteligente de salas de
              juntas.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms-and-conditions" className="text-gray-400 hover:text-white text-sm">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-400 hover:text-white text-sm">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-400 hover:text-white text-sm">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-medium mb-4">Contacto</h3>
            <p className="text-gray-400 text-sm">
              info@spec.com
              <br />
              +52 55 1234 5678
              <br />
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <p className="text-gray-400 text-sm text-center">
            &copy; {new Date().getFullYear()} SPEC. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;