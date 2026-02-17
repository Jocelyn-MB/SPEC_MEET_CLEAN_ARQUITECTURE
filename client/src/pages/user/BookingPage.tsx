import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; 
import { AxiosError } from 'axios';
import { CalendarIcon, ClockIcon, CreditCardIcon, CheckIcon } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// --- CONFIGURACIÓN DE STRIPE ---
const stripePromise = loadStripe("pk_test_51SuGE6R7CcXcMDYUm8apqxqrXheiJOYSBHT6Do6JOhOYmElKCzlcbJgoiW3YUAt4qKzYdANmnXoVde4Q6LCfxyQU00e1smFJUy");

type BookingStep = 'date' | 'payment' | 'confirmation';
type PaymentMethod = 'card' | 'applepay' | 'googlepay' | 'spei';

// --- COMPONENTE CHECKOUT FORM ---
const CheckoutForm = ({ totalAmount, onSuccess, onError }: { totalAmount: number, onSuccess: () => void, onError: (msg: string) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Error al procesar el pago");
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg border border-white border-opacity-20">
        <PaymentElement 
          options={{
            layout: "tabs",
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
          }} 
        />
      </div>
      <button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white font-bold rounded-md hover:bg-opacity-30 transition-all border border-white border-opacity-30 shadow-lg"
      >
        {isProcessing ? 'Procesando pago...' : `Pagar $${totalAmount.toFixed(2)} MXN`}
      </button>
    </form>
  );
};

// --- PÁGINA PRINCIPAL ---
const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<string>(''); 
  const [clientSecret, setClientSecret] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  
  // Estado para reservas existentes (de otros)
  const [existingReservations, setExistingReservations] = useState<{start: Date, end: Date}[]>([]);
  // Estado para MIS reservas (azul)
  const [myBookedDates, setMyBookedDates] = useState<string[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');


  // 1. CARGAR SALA
  React.useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await api.get('/rooms');
        const rooms = response.data;
        if (Array.isArray(rooms) && rooms.length > 0) {
          setRoomId(rooms[0].id);
        }
      } catch (error) {
        console.error("Error obteniendo salas:", error);
      }
    };
    fetchRoom();
  }, []);

  interface ReservationResponse {
    start_time: string;
    end_time: string;
  }

  // 2. CARGAR RESERVAS DEL DÍA SELECCIONADO
  React.useEffect(() => {
    const fetchReservations = async () => {
        if (!roomId || !selectedDate) return;
        
        try {
            const response = await api.get(`/reservations?roomId=${roomId}&date=${selectedDate}`);
            
            const data = response.data as ReservationResponse[];
            const formattedReservations = data.map((res) => ({
                start: new Date(res.start_time),
                end: new Date(res.end_time)
            }));
            
            setExistingReservations(formattedReservations);
        } catch (error) {
            console.error("Error cargando horarios ocupados:", error);
        }
    };

    fetchReservations();
  }, [selectedDate, roomId]);

  // 3. CARGAR "MIS RESERVAS" PARA EL CALENDARIO
  React.useEffect(() => {
    const fetchMyBookings = async () => {
        try {
            const response = await api.get('/reservations/my-reservations');
            setMyBookedDates(response.data); 
        } catch (error) {
            console.error("Error cargando mis reservas:", error);
        }
    };
    fetchMyBookings();
  }, [clientSecret]);


  // --- FUNCIONES AUXILIARES (LOGICA) ---

  const getDailyTimeSlots = () => {
    const slots = [];
    let startHour = 9;
    const endHour = 18;

    while (startHour < endHour) {
        slots.push(`${startHour.toString().padStart(2, '0')}:00`);
        slots.push(`${startHour.toString().padStart(2, '0')}:30`);
        startHour++;
    }
    slots.push(`${endHour}:00`);

    if (!selectedDate) return slots;

    const now = new Date();
    const selectedDateObj = new Date(`${selectedDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDateObj);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        return slots.filter(slot => {
            const [slotHour, slotMin] = slot.split(':').map(Number);
            if (slotHour > currentHour) return true;
            if (slotHour === currentHour && slotMin > currentMinutes) return true;
            return false;
        });
    }

    if (checkDate < today) return [];
    return slots;
  };

  const calculateISODates = () => {
    if (!selectedDate || !selectedTimeSlot) return null;
    const start = new Date(`${selectedDate}T${selectedTimeSlot}:00`);
    const end = new Date(start);
    end.setHours(end.getHours() + selectedDuration);
    return {startTime: start.toISOString(), endTime: end.toISOString()};
  };

  const calculateTotal = () => {
    return 200 * selectedDuration;
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const generateAccessCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const formatDate = (dateString: string) => {
    if(!dateString) return '';
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString('es-ES',{
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentCalendarMonth(newDate);
  };

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); 
    const days = [];
   
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), i));
    }
    return days;
  };

  const hasDayReservations = (day: Date) => {
    const calendarStr = day.toISOString().split('T')[0];
    return existingReservations.some(r => {
      const reservationDateStr = r.start.toISOString().split('T')[0];
      return reservationDateStr === calendarStr;
    });
  };

  const isTimeSlotAvailable = (dateStr: string, timeStr: string) => {
    if (existingReservations.length === 0) return true;

    const proposedStart = new Date(`${dateStr}T${timeStr}:00`);
    const proposedEnd = new Date(proposedStart);
    proposedEnd.setHours(proposedEnd.getHours() + selectedDuration);

    const CLEANING_TIME_MS = 30 * 60 * 1000; 

    return !existingReservations.some(reservation => {
        const busyStart = reservation.start.getTime(); 
        const busyEnd = reservation.end.getTime() + CLEANING_TIME_MS; 
        return (
            proposedStart.getTime() < busyEnd && 
            proposedEnd.getTime() > busyStart
        );
    });
  };


  // --- HANDLERS (NAVEGACION Y ACCIONES) ---

  const handleNextStep = async () => {
    if (currentStep === 'date') {
      if (!selectedDate || !selectedTimeSlot) return;
      
      setIsProcessing(true);
      setPaymentError('');

      try {
        const dates = calculateISODates();
        
        if (!dates) throw new Error("Fechas inválidas");
        if (!roomId) throw new Error("No hay salas disponibles en el sistema");

        const reservationPayload = {
          roomId: roomId,
          startTime: dates.startTime,
          endTime: dates.endTime,
          termsAccepted: true,
          acceptedVersion: "1.0"
        };

        // Enviamos directo con api.post para asegurar compatibilidad con el backend
        const response = await api.post('/reservations', reservationPayload);
        
        const { clientSecret } = response.data;

        if (clientSecret) {
          setClientSecret(clientSecret);
          setCurrentStep('payment');
        } else {
          throw new Error("El servidor no devolvió la información de pago");
        }

      } catch (error) {
        console.error(error);
        const axiosError = error as AxiosError<{error: string}>;
        setPaymentError(axiosError.response?.data?.error || "Error al crear la reserva");
      } finally {
        setIsProcessing(false);
      }

    } else if (currentStep === 'confirmation') {
      navigate('/dashboard');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment'){
      setClientSecret('');
      setPaymentError('');
      setCurrentStep('date');     
    }
  };
  
  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
  };


  // --- RENDERIZADO (VISTAS) ---

  const renderCalendarView = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">
          {currentCalendarMonth.toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        })}
        </h3>
        <div className="flex space-x-2">
          <button onClick={() => navigateMonth('prev')} className="p-2 rounded-md bg-white bg-opacity-10 backdrop-blur-sm text-white hover:bg-opacity-20">&lt;</button>
          <button onClick={() => setCurrentCalendarMonth(new Date())} className="p-2 rounded-md bg-white bg-opacity-10 backdrop-blur-sm text-white hover:bg-opacity-20">Hoy</button>
          <button onClick={() => navigateMonth('next')} className="p-2 rounded-md bg-white bg-opacity-10 backdrop-blur-sm text-white hover:bg-opacity-20">&gt;</button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center p-2 font-medium text-white text-sm">
                {day}
            </div>
        ))}

        {generateCalendarDays().map((day, index) => {
            if (!day) {
                return <div key={`empty-${index}`} className="h-20 bg-white bg-opacity-5 backdrop-blur-sm rounded-md"></div>;
            }
            const dateString = day.toISOString().split('T')[0];
            const isSelected = dateString === selectedDate;
            const hasReservations = hasDayReservations(day);
            const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
            const isMyBooking = myBookedDates.includes(dateString);

            return (
                <div 
                    key={day.toString()} 
                    className={`h-20 p-1 rounded-md overflow-hidden cursor-pointer relative border transition-all
                    ${isSelected ? 'bg-white bg-opacity-30 border-white border-opacity-50' : ''}
                    ${isToday ? 'bg-white bg-opacity-10 border-blue-400 border-opacity-50' : 'bg-white bg-opacity-5 border-transparent'}
                    ${!isSelected ? 'hover:bg-white hover:bg-opacity-15' : ''}
                    `} 
                    onClick={() => {
                        const dateStr = day.toISOString().split('T')[0];
                        setSelectedDate(dateStr);
                    }}
                >
                    <div className={`text-right p-1 text-sm ${isToday ? 'font-bold text-blue-300' : 'text-white'}`}>
                        {day.getDate()}
                    </div>

                    <div className="flex flex-col gap-1 items-start pl-1">
                        {isMyBooking && (
                            <div className="px-1.5 py-0.5 text-[10px] bg-blue-500 text-white rounded shadow-sm font-medium w-full truncate">
                                Mi Reserva
                            </div>
                        )}

                        {hasReservations && !isMyBooking && (
                            <div className="flex items-center gap-1 mt-1">
                                <div className="w-2 h-2 bg-red-400 rounded-full shadow-sm"></div>
                                <span className="text-[10px] text-red-200/70 hidden sm:block">Ocupado</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg">
          <h4 className="text-md font-medium text-white mb-3">
            Horarios disponibles para {formatDate(selectedDate)}
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {getDailyTimeSlots().map(time => {
                const isAvailable = isTimeSlotAvailable(selectedDate, time);
                return (
                    <button key={time} type="button" disabled={!isAvailable} onClick={() => setSelectedTimeSlot(time)} 
                        className={`py-2 px-3 rounded-md text-center
                        ${!isAvailable ? 'bg-red-500 bg-opacity-30 text-white cursor-not-allowed' : selectedTimeSlot === time ? 'bg-white bg-opacity-30 text-white' : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'}
                        `}>
                        {time}
                        {!isAvailable && <div className="text-xs mt-1">Reservado</div>}
                    </button>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderDateSelection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white mb-4">Selecciona fecha y hora</h3>
      </div>
      {renderCalendarView()}
      
      {selectedTimeSlot && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">Duración (horas)</label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(hours => (
                <button key={hours} type="button" onClick={() => setSelectedDuration(hours)} 
                    className={`py-2 px-3 rounded-md text-center ${selectedDuration === hours ? 'bg-white bg-opacity-30 text-white' : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'}`}>
                    {hours} {hours === 1 ? 'hora' : 'horas'}
                </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedTimeSlot && (
        <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg mt-6">
          <h4 className="text-sm font-medium text-white mb-2">Resumen</h4>
          <div className="flex items-center mb-2">
            <CalendarIcon className="h-5 w-5 text-white mr-2" />
            <span className="text-white">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center mb-2">
            <ClockIcon className="h-5 w-5 text-white mr-2" />
            <span className="text-white">
              {selectedTimeSlot} - {calculateEndTime(selectedTimeSlot, selectedDuration)}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-lg font-semibold text-white">${200 * selectedDuration} MXN</span>
            <span className="text-sm text-white ml-1">+ IVA</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaymentSelection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white mb-4">Información de pago</h3>
      
      <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg mb-6">
        <div className="flex justify-between text-white mb-2">
            <span>Reserva ({selectedDuration}h)</span>
            <span>${(200 * selectedDuration).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-bold text-lg border-t pt-2 border-white border-opacity-20">
            <span>Total</span>
            <span>${calculateTotal().toFixed(2)} MXN</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
         <button onClick={() => setPaymentMethod('card')} className={`py-3 px-4 rounded-md flex justify-center ${paymentMethod === 'card' ? 'bg-white bg-opacity-30 text-white' : 'bg-white bg-opacity-10 text-white'}`}>
            <CreditCardIcon className="mr-2" /> Tarjeta
         </button>
         <button onClick={() => setPaymentMethod('spei')} className={`py-3 px-4 rounded-md flex justify-center ${paymentMethod === 'spei' ? 'bg-white bg-opacity-30 text-white' : 'bg-white bg-opacity-10 text-white'}`}>
            Transferencia
         </button>
      </div>

      {paymentMethod === 'card' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance : { theme: 'night', labels: 'floating' }}}>
            <CheckoutForm totalAmount={calculateTotal()} onSuccess={handlePaymentSuccess} onError={setPaymentError}/>
        </Elements>
      )}

      {paymentMethod === 'spei' && (
          <div className="text-white bg-white bg-opacity-10 p-4 rounded">
              Sistema de SPEI en construcción (usa tarjeta por ahora).
          </div>
      )}
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6 text-center text-white">
      <div className="flex justify-center">
        <div className="bg-green-500 bg-opacity-80 backdrop-blur-sm rounded-full p-4 shadow-lg">
          <CheckIcon className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-2">¡Reserva Confirmada!</h3>
        <p className="opacity-90">Tu pago ha sido procesado exitosamente.</p>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg max-w-sm mx-auto border border-white border-opacity-20">
        <div className="mb-4 text-left">
          <h4 className="text-lg font-medium mb-2 border-b border-white border-opacity-20 pb-1">Detalles</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 opacity-80" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2 opacity-80" />
              <span>{selectedTimeSlot} - {calculateEndTime(selectedTimeSlot, selectedDuration)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 opacity-80">Código de acceso temporal</h4>
          <div className="bg-black bg-opacity-30 rounded-md py-3 px-4 border border-white border-opacity-10">
            <span className="font-mono text-2xl font-bold tracking-widest text-green-400">
              {generateAccessCode()}
            </span>
          </div>
        </div>
        
        <p className="text-xs opacity-70">Hemos enviado el recibo a tu correo.</p>
      </div>

      <button onClick={() => navigate('/dashboard')} className="w-full px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md font-bold transition-all border border-white border-opacity-30">
        Ir a Mi Panel
      </button>
    </div>
  );

  const renderProgressBar = () => {
    const steps = [{ key: 'date', label: 'Fecha' }, { key: 'payment', label: 'Pago' }, { key: 'confirmation', label: 'Fin' }];
    const currentStepIndex = steps.findIndex(step => step.key === currentStep);
    return (
        <div className="flex items-center justify-between mb-8 w-full">
            {steps.map((step, idx) => (
                <React.Fragment key={step.key}>
                    <div className={`flex flex-col items-center z-10 ${idx <= currentStepIndex ? 'opacity-100 font-bold' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center mb-1 ${idx <= currentStepIndex ? 'bg-white bg-opacity-30 text-white' : 'bg-white bg-opacity-10 text-white'}`}>
                            {idx < currentStepIndex ? <CheckIcon className="h-5 w-5" /> : idx + 1}
                        </div>
                        <span className="text-xs text-white">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${idx < currentStepIndex ? 'bg-white bg-opacity-50' : 'bg-white bg-opacity-10'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
  };

  return (
    <div className="w-full min-h-screen relative py-10 px-4">
      <div className="fixed inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('https://uploadthingy.s3.us-west-1.amazonaws.com/mnx4A3B36Dy2nyF5i8QPC8/PHOTO-2025-02-03-12-44-43.jpg')"}}></div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Reservar Sala</h1>
        
        {renderProgressBar()}

        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg shadow-lg p-6">
            {currentStep === 'date' && renderDateSelection()}
            {currentStep === 'payment' && renderPaymentSelection()}
            {currentStep === 'confirmation' && renderConfirmation()}

            {paymentError && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-80 text-white rounded-md text-center">{paymentError}</div>
            )}
            
            {currentStep === 'date' && (
                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleNextStep} 
                        disabled={isProcessing || !selectedTimeSlot}
                        className="px-6 py-2 bg-white bg-opacity-15 backdrop-blur-sm text-white rounded-md hover:bg-opacity-30 transition-all border border-white border-opacity-30">
                        {isProcessing ? 'Cargando...' : 'Continuar al Pago'}
                    </button>
                </div>
            )}  
            
            {currentStep === 'payment' && (
                <div className="mt-4">
                     <button onClick={handlePrevStep} className="text-white underline text-sm opacity-70 hover:opacity-100">
                        Cancelar y volver
                     </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;