import React from 'react';
import { Link } from 'react-router-dom';
const Footer: React.FC = () => {
  return <footer className="bg-background">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <div className='h-10 w-40 relative overflow-hidden flex items-center  -ml-6'>
                <img src="/MEET.svg" alt=".MEET" className="h-25 w-auto object-contain  brightness-0 invert" />
              </div>
            </div>
            <p className="text-secondary/45  text-sm leading-relaxed max-w-sm tracking-widest font-light">
              La solución integral para la gestión inteligente de salas de
              juntas.
            </p>
          </div>
          
          <div>
            <h3 className="text-secondary/40 font-medium mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms-and-conditions" className="text-secondary/40 hover:text-secondary text-xs leading-loose font-bold tracking-widest">
                  Términos y Condiciones
                </Link>
              </li>
              {/*  <li>
                <Link to="#" className="text-secondary/40 hover:text-secondary text-xs tracking-widest">
                  Política de Privacidad
                </Link>
              </li>*/}
              {/*  <li>
                <Link to="#" className="text-secondary/40 hover:text-secondary text-xs tracking-widest">
                  Política de Cookies
                </Link>
              </li>*/}
            </ul>
          </div>
          <div>
            <h3 className="text-secondary/40 font-medium mb-4">Contacto</h3>
            <p className="text-secondary/45 text-sm">
              info@spec.com
              <br />
              +52 55 1234 5678
              <br />
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <p className="font-makron font-thin text-secondary text-sm text-center">
            &copy; {new Date().getFullYear()} .MEET Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;