
"use client";
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { HeaderWrapper, BottomNav } from "@/components/header";
import * as firestoreService from '@/lib/firestoreService';
import { type Doctor, type Service, type BankDetail, type Coupon, type Appointment } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Star, CheckCircle, Banknote, Landmark, Upload, DollarSign, ClipboardCheck, Tag, Loader2, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppointments } from "@/lib/appointments";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import Link from "next/link";

const dayKeyMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
    const slots: string[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
        currentMinute += duration;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute %= 60;
        }
    }
    return slots;
}

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const { addAppointment } = useAppointments();
  const { coupons } = useSettings();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [step, setStep] = useState<'selectDateTime' | 'selectServices' | 'selectPayment' | 'confirmation'>('selectDateTime');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | null>(null);
  const [selectedBankDetail, setSelectedBankDetail] = useState<BankDetail | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (id) {
        const fetchDoctorAndAppointments = async () => {
            setIsLoading(true);
            try {
                const [docData, docAppointments] = await Promise.all([
                    firestoreService.getDoctor(id),
                    firestoreService.getDoctorAppointments(id),
                ]);

                if (docData) {
                    setDoctor(docData);
                    setAppointments(docAppointments);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Médico no encontrado",
                        description: "No se pudo encontrar el perfil de este médico.",
                    });
                    router.push('/find-a-doctor');
                }
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Error de Carga",
                    description: "No se pudieron cargar los datos del médico.",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchDoctorAndAppointments();
    }
  }, [id, router, toast]);

  const subtotal = useMemo(() => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  }, [selectedServices]);

  const finalPrice = useMemo(() => {
    if (!doctor) return 0;
    const priceAfterDiscount = (doctor.consultationFee || 0) + subtotal - discountAmount;
    return priceAfterDiscount < 0 ? 0 : priceAfterDiscount;
  }, [doctor, subtotal, discountAmount]);

  const availableSlots = useMemo(() => {
    if (!doctor || !selectedDate) return [];

    const dayKey = dayKeyMapping[selectedDate.getDay()];
    const daySchedule = doctor.schedule[dayKey];

    if (!daySchedule.active) return [];

    const allSlotsSet = new Set<string>();
    daySchedule.slots.forEach(slot => {
        const generated = generateTimeSlots(slot.start, slot.end, doctor.slotDuration);
        generated.forEach(s => allSlotsSet.add(s));
    });

    const allSlots = Array.from(allSlotsSet).sort();

    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const bookedSlots = appointments
      .filter(appt => appt.date === selectedDateString)
      .map(appt => appt.time);

    return allSlots.filter(slot => !bookedSlots.includes(slot));
  }, [selectedDate, doctor, appointments]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };
  
  const handleApplyCoupon = () => {
    if (!id || !couponInput || !doctor) return;
    const applicableCoupons = coupons.filter(c => c.scope === 'general' || c.scope === id);
    const coupon = applicableCoupons.find(c => c.code.toUpperCase() === couponInput.toUpperCase());
    const totalBeforeDiscount = (doctor.consultationFee || 0) + subtotal;

    if (coupon) {
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (totalBeforeDiscount * coupon.value) / 100;
      } else {
        discount = coupon.value;
      }
      
      const finalDiscount = Math.min(discount, totalBeforeDiscount);

      setDiscountAmount(finalDiscount);
      setAppliedCoupon(coupon);
      toast({
        title: "¡Cupón aplicado!",
        description: `Se ha aplicado un descuento de ${coupon.discountType === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Cupón no válido",
        description: "El código de cupón ingresado no es válido o ha expirado."
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleDateTimeSubmit = () => {
    if (selectedDate && selectedTime) {
      setStep('selectServices');
    }
  };

  const handleServicesSubmit = () => {
    setStep('selectPayment');
  };

  const handlePaymentSubmit = async () => {
    if (!doctor || !selectedDate || !selectedTime || !paymentMethod) return;

    if (!user) {
      toast({
        title: "Debes iniciar sesión",
        description: "Redirigiendo a la página de inicio de sesión...",
      });
      router.push(`/auth/login?redirect=/doctors/${id}`);
      return;
    }
    
    if (paymentMethod === 'transferencia' && (!paymentProof || !selectedBankDetail)) {
      toast({
        variant: "destructive",
        title: "Información Faltante",
        description: "Por favor, selecciona una cuenta y sube el comprobante de pago.",
      });
      return;
    }
    
    let proofUrl: string | null = null;
    if (paymentMethod === 'transferencia' && paymentProof) {
        proofUrl = await fileToDataUri(paymentProof);
    }

    await addAppointment({
      doctorId: doctor.id,
      doctorName: doctor.name,
      consultationFee: doctor.consultationFee || 0,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      services: selectedServices,
      totalPrice: finalPrice,
      paymentMethod: paymentMethod,
      paymentStatus: 'Pendiente',
      paymentProof: proofUrl,
      attendance: 'Pendiente',
      patientConfirmationStatus: 'Pendiente',
    });

    setStep('confirmation');
  };

  const resetBookingFlow = () => {
    setStep('selectDateTime');
    setSelectedDate(new Date());
    setSelectedTime(null);
    setSelectedServices([]);
    setPaymentMethod(null);
    setSelectedBankDetail(null);
    setPaymentProof(null);
    handleRemoveCoupon();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col min-h-screen">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center">
          <p>Médico no encontrado.</p>
        </main>
      </div>
    );
  }

  if (doctor.status !== 'active') {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <HeaderWrapper />
            <main className="flex-1 py-8 md:py-12 bg-muted/40 pb-20 md:pb-0">
                <div className="container max-w-4xl mx-auto">
                     <Card className="mb-8 overflow-hidden">
                        <div className="relative">
                            <Image
                                src={doctor.bannerImage}
                                alt={`Consultorio de ${doctor.name}`}
                                width={1200}
                                height={400}
                                className="w-full h-48 object-cover filter grayscale"
                                data-ai-hint="medical office"
                            />
                            <div className="absolute -bottom-16 left-8">
                                <Avatar className="h-32 w-32 border-4 border-background bg-muted">
                                    <AvatarImage src={doctor.profileImage} alt={doctor.name} className="filter grayscale" />
                                    <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                        <div className="pt-20 px-8 pb-6">
                            <h2 className="text-3xl font-bold font-headline">{doctor.name}</h2>
                            <p className="text-muted-foreground font-medium text-xl">{doctor.specialty}</p>
                        </div>
                    </Card>
                    <Card>
                        <CardHeader className="items-center text-center">
                          <XCircle className="h-16 w-16 text-destructive mb-4" />
                          <CardTitle className="text-2xl">Médico no disponible</CardTitle>
                          <CardDescription>
                            Este especialista no se encuentra disponible para agendar citas en este momento.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Button asChild>
                                <Link href="/find-a-doctor">
                                    Buscar otros especialistas
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <BottomNav />
        </div>
    );
  }

  const isDayDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
        return true;
    }
    const dayKey = dayKeyMapping[date.getDay()];
    return !doctor.schedule[dayKey].active;
  }

  const renderStepContent = () => {
    switch (step) {
      case 'selectDateTime':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Paso 1: Selecciona Fecha y Hora</CardTitle>
              <CardDescription>Elige un horario disponible para tu cita.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime(null); // Reset time when date changes
                    }}
                    className="rounded-md border bg-card"
                    disabled={isDayDisabled}
                  />
                </div>
                <div className="flex flex-col">
                  {selectedDate ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.length > 0 ? availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          {time}
                        </Button>
                      )) : <p className="col-span-full text-center text-muted-foreground">No hay horarios disponibles este día.</p>}
                    </div>
                  ) : (
                     <p className="text-muted-foreground text-center md:text-left mt-4">Por favor, selecciona una fecha primero.</p>
                  )}

                  <Button
                    onClick={handleDateTimeSubmit}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full mt-8"
                    size="lg"
                  >
                    Continuar al Paso 2
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        );

      case 'selectServices':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Paso 2: Elige los Servicios</CardTitle>
              <CardDescription>La tarifa de consulta se añade automáticamente. Selecciona los servicios adicionales que necesites.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-md border p-4">
                {doctor.services.length > 0 ? doctor.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.some((s) => s.id === service.id)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-base font-normal">
                        {service.name}
                      </Label>
                    </div>
                    <span className="font-semibold text-primary">${service.price}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center">El Dr. no tiene servicios adicionales registrados.</p>}
              </div>
              
              <div className="space-y-2">
                 <Label>¿Tienes un cupón de descuento?</Label>
                 <div className="flex gap-2">
                    <Input
                      placeholder="CÓDIGO"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button variant="outline" onClick={handleRemoveCoupon}>Quitar</Button>
                    ) : (
                      <Button onClick={handleApplyCoupon} disabled={!couponInput || ((doctor.consultationFee || 0) + subtotal) === 0}>Aplicar</Button>
                    )}
                 </div>
              </div>

              <div className="text-lg font-semibold p-4 bg-muted/50 rounded-lg space-y-3">
                 <div className="w-full flex justify-between items-center text-base font-normal text-muted-foreground">
                    <span>Tarifa de Consulta:</span>
                    <span>${(doctor.consultationFee || 0).toFixed(2)}</span>
                </div>
                <div className="w-full flex justify-between items-center">
                    <span>Subtotal Servicios:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                    <div className="w-full flex justify-between items-center text-green-600">
                        <div className="flex items-center gap-1.5"><Tag className="h-4 w-4"/> Cupón ({appliedCoupon.code})</div>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                 <Separator/>
                <div className="w-full flex justify-between items-center text-xl font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-primary">${finalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" onClick={() => setStep('selectDateTime')} className="w-full">
                    Atrás
                  </Button>
                  <Button onClick={handleServicesSubmit} className="w-full" size="lg">
                    Continuar al Paso 3
                  </Button>
              </div>
            </CardContent>
          </>
        );

      case 'selectPayment':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Paso 3: Método de Pago</CardTitle>
              <CardDescription>Elige cómo deseas pagar tu cita.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={paymentMethod || ''} onValueChange={(value) => setPaymentMethod(value as 'efectivo' | 'transferencia')}>
                <div className="flex items-center space-x-3 p-4 border rounded-md">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo" className="flex items-center space-x-3 cursor-pointer w-full">
                    <Banknote className="h-6 w-6 text-green-600" />
                    <div>
                      <span className="font-semibold">Efectivo</span>
                      <p className="text-sm text-muted-foreground">Paga el monto total el día de tu cita.</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-md">
                  <RadioGroupItem value="transferencia" id="transferencia" />
                  <Label htmlFor="transferencia" className="flex items-center space-x-3 cursor-pointer w-full">
                    <Landmark className="h-6 w-6 text-blue-600" />
                    <div>
                      <span className="font-semibold">Transferencia Bancaria</span>
                      <p className="text-sm text-muted-foreground">Realiza el pago y sube el comprobante.</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'transferencia' && (
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Selecciona una Cuenta y Sube el Comprobante</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {doctor.bankDetails.length > 0 ? (
                        <RadioGroup
                            value={selectedBankDetail?.id || ''}
                            onValueChange={(value) => {
                                const bankId = value;
                                setSelectedBankDetail(doctor.bankDetails.find(bd => bd.id === bankId) || null);
                            }}
                            className="space-y-2"
                        >
                            {doctor.bankDetails.map((bd) => (
                                <div key={bd.id} className="flex items-center space-x-3 rounded-md border bg-background p-3">
                                    <RadioGroupItem value={bd.id} id={`bank-${bd.id}`} />
                                    <Label
                                        htmlFor={`bank-${bd.id}`}
                                        className="flex w-full cursor-pointer items-center gap-2 font-normal"
                                    >
                                        <Landmark className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <span className="font-semibold">{bd.bank}</span>
                                            <p className="text-xs text-muted-foreground">{bd.accountHolder}</p>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                      ) : (
                        <p className="text-sm text-center text-muted-foreground p-4 bg-background rounded-md">
                          Este médico no ha registrado cuentas bancarias para transferencias.
                        </p>
                      )}

                    {selectedBankDetail && (
                      <div className="space-y-2 border-t pt-4 mt-4">
                        <p><strong>Banco:</strong> {selectedBankDetail.bank}</p>
                        <p><strong>Titular:</strong> {selectedBankDetail.accountHolder}</p>
                        <p><strong>C.I./R.I.F.:</strong> {selectedBankDetail.idNumber}</p>
                        <p><strong>Nro. Cuenta:</strong> {selectedBankDetail.accountNumber}</p>
                      </div>
                    )}
                    
                    <Separator className="my-4"/>
                    <Label htmlFor="paymentProof">Sube tu comprobante de pago:</Label>
                    <Input id="paymentProof" type="file" onChange={handleFileChange} />
                    {paymentProof && <p className="text-sm text-green-600">Archivo seleccionado: {paymentProof.name}</p>}
                  </CardContent>
                </Card>
              )}

              <div className="text-lg font-semibold p-4 bg-muted/50 rounded-lg">
                <div className="w-full flex justify-between items-center text-xl font-bold">
                    <span>Total a Pagar:</span>
                    <span className="text-primary">${finalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" onClick={() => setStep('selectServices')} className="w-full">
                    Atrás
                  </Button>
                  <Button onClick={handlePaymentSubmit} disabled={!paymentMethod || (paymentMethod === 'transferencia' && (!paymentProof || !selectedBankDetail))} className="w-full" size="lg">
                    Confirmar Cita
                  </Button>
              </div>
            </CardContent>
          </>
        );

      case 'confirmation':
        return (
          <>
            <CardHeader className="items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <CardTitle className="text-2xl">¡Cita Agendada con Éxito!</CardTitle>
              <CardDescription>
                Tu cita está confirmada. Aquí tienes los detalles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-lg">Resumen de la Cita</h4>
                    <p><strong>Médico:</strong> {doctor.name}</p>
                    <p><strong>Fecha:</strong> {selectedDate?.toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><strong>Hora:</strong> {selectedTime}</p>
                    <div>
                        <p><strong>Tarifa de Consulta:</strong> ${(doctor.consultationFee || 0).toFixed(2)}</p>
                        <p><strong>Servicios Adicionales:</strong></p>
                        <ul className="list-disc list-inside text-muted-foreground">
                            {selectedServices.map(s => <li key={s.id}>{s.name} (${s.price})</li>)}
                        </ul>
                    </div>
                    <Separator/>
                     <div className="flex justify-between items-center font-bold">
                        <span>Total Pagado:</span>
                        <span>${finalPrice.toFixed(2)}</span>
                    </div>
                </div>

                 <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-lg">Detalles del Pago</h4>
                    <div className="flex items-center gap-2">
                        <p><strong>Método:</strong> <span className="capitalize">{paymentMethod}</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 font-semibold">
                         <ClipboardCheck className="h-5 w-5"/>
                        <p><strong>Estado:</strong> Pendiente</p>
                    </div>
                     {appliedCoupon && (
                      <p className="text-sm text-green-600">Cupón '{appliedCoupon.code}' aplicado (-${discountAmount.toFixed(2)}).</p>
                    )}
                    {paymentMethod === 'transferencia' && (
                        <p className="text-sm text-muted-foreground">El comprobante ha sido enviado y está pendiente de revisión por el doctor.</p>
                    )}
                     {paymentMethod === 'efectivo' && (
                        <p className="text-sm text-muted-foreground">Recuerda llevar el monto exacto el día de tu cita.</p>
                    )}
                </div>

              <Button onClick={resetBookingFlow} className="w-full" size="lg">
                Reservar Otra Cita
              </Button>
            </CardContent>
          </>
        );
    }
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderWrapper />
      <main className="flex-1 py-8 md:py-12 bg-muted/40 pb-20 md:pb-0">
        <div className="container max-w-4xl mx-auto">
          
          <Card className="mb-8 overflow-hidden">
            <div className="relative">
                <Image
                    src={doctor.bannerImage}
                    alt={`Consultorio de ${doctor.name}`}
                    width={1200}
                    height={400}
                    className="w-full h-48 object-cover"
                    data-ai-hint="medical office"
                />
                <div className="absolute -bottom-16 left-8">
                    <Avatar className="h-32 w-32 border-4 border-background bg-muted">
                        <AvatarImage src={doctor.profileImage} alt={doctor.name} />
                        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
            <div className="pt-20 px-8 pb-6">
                 <h2 className="text-3xl font-bold font-headline">{doctor.name}</h2>
                 <p className="text-primary font-medium text-xl">{doctor.specialty}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{doctor.rating}</span>
                    <span className="text-muted-foreground">({doctor.reviewCount} reseñas)</span>
                </div>
            </div>
             <Separator/>
              <div className="p-8 space-y-4">
                  <p className="text-sm text-muted-foreground">{doctor.description}</p>
                   <div className="flex items-start gap-2 text-muted-foreground mt-2 text-sm">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-foreground">{doctor.address}</p>
                            <p>{doctor.sector}, {doctor.city}</p>
                        </div>
                    </div>
              </div>
          </Card>
          
          <Card>
              {renderStepContent()}
          </Card>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
