
import type { City, Doctor, Seller, Patient, Appointment, SellerPayment, MarketingMaterial, AdminSupportTicket, DoctorPayment, AppSettings } from './types';
import { Timestamp } from 'firebase/firestore';

// Helper para crear timestamps de Firestore para datos mock
const createFirestoreTimestamp = (date: Date): Timestamp => {
  return new Timestamp(Math.floor(date.getTime() / 1000), 0);
};

export const specialties = [
  "Cardiología",
  "Dermatología",
  "Neurología",
  "Pediatría",
  "Oncología",
  "Ortopedia",
  "Ginecología",
  "Neumonología",
  "Medicina Estética",
];

export const cities: City[] = [
  { name: "Caracas", subscriptionFee: 50 },
  { name: "Maracaibo", subscriptionFee: 40 },
  { name: "Valencia", subscriptionFee: 45 },
];

const mockCompanyBankDetails: AppSettings['companyBankDetails'] = [
  {
    id: 'compbank1',
    bank: 'Banesco',
    accountHolder: 'SUMA C.A.',
    accountNumber: '0134-0000-0000-0000-0000',
    idNumber: 'J-12345678-9',
    description: 'Cuenta Principal',
  },
  {
    id: 'compbank2',
    bank: 'Mercantil',
    accountHolder: 'SUMA C.A.',
    accountNumber: '0105-0000-0000-0000-0000',
    idNumber: 'J-12345678-9',
    description: 'PagoMóvil',
  },
];

const mockCoupons: AppSettings['coupons'] = [
  { 
    id: 'coupon1', 
    code: 'SUMA10', 
    description: 'Descuento de $10 en tu primera consulta',
    discountType: 'fixed', 
    discountValue: 10, 
    validFrom: createFirestoreTimestamp(new Date()),
    validTo: createFirestoreTimestamp(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    isActive: true,
    createdAt: createFirestoreTimestamp(new Date()),
    updatedAt: createFirestoreTimestamp(new Date()),
    scopeType: 'all',
    scope: 'general',
    value: 10
  },
  { 
    id: 'coupon2', 
    code: 'VERANO20', 
    description: '20% de descuento en consultas de verano',
    discountType: 'percentage', 
    discountValue: 20, 
    validFrom: createFirestoreTimestamp(new Date()),
    validTo: createFirestoreTimestamp(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    isActive: true,
    createdAt: createFirestoreTimestamp(new Date()),
    updatedAt: createFirestoreTimestamp(new Date()),
    scopeType: 'specific',
    scopeDoctors: ['1'],
    scope: '1',
    value: 20
  }
];

const defaultSchedule: Doctor['schedule'] = {
    monday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { active: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
    saturday: { active: false, slots: [] },
    sunday: { active: false, slots: [] },
};

export const sellers: Seller[] = [
  {
    id: '1',
    name: "Vendedora Principal",
    email: "vendedora@venta.com",
    password: "1234",
    phone: "0412-9876543",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "VENDE123",
    commissionRate: 0.20,
    bankDetails: [
      {
        id: 'sbank1',
        bank: "Bancamiga",
        accountNumber: "0172-0009-0009-0009-0009",
        accountHolder: "Vendedora Principal",
        idNumber: "V-99.888.777",
        description: "Cuenta en Dólares",
      }
    ],
    expenses: [
      { id: 'sexp1', date: '2024-05-10', description: 'Transporte a reuniones', amount: 20 },
      { id: 'sexp2', date: '2024-05-22', description: 'Impresión de material', amount: 15 },
    ]
  },
  {
    id: '2',
    name: "Maria Garcia",
    email: "maria.g@venta.com",
    password: "1234",
    phone: "0414-1112233",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "MARIA456",
    commissionRate: 0.18,
    bankDetails: [],
    expenses: []
  },
   {
    id: '3',
    name: "Sofia Martinez",
    email: "sofia.m@venta.com",
    password: "1234",
    phone: "0424-4445566",
    profileImage: "https://placehold.co/400x400.png",
    referralCode: "SOFIA789",
    commissionRate: 0.20,
    bankDetails: [],
    expenses: []
  }
];


export const doctors: Doctor[] = [
  { 
    id: '1', 
    name: "Dr. Ana Rodriguez", 
    cedula: "V-12.345.678",
    specialty: "Cardiología", 
    city: "Caracas", 
    address: "Av. Francisco de Miranda, Centro Lido, Piso 5",
    sector: "Chacao",
    rating: 4.9, 
    reviewCount: 120, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png", 
    aiHint: "woman doctor",
    description: "Cardióloga con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares. Comprometida con la prevención y el bienestar de mis pacientes.",
    services: [
      { id: 's101', name: "Consulta Cardiológica", price: 50 },
      { id: 's102', name: "Electrocardiograma (EKG)", price: 30 },
      { id: 's103', name: "Ecocardiograma", price: 80 },
    ],
    bankDetails: [
      { id: 'bd1001', bank: "Banesco", accountNumber: "0134-0001-0001-0001-0001", accountHolder: "Ana Rodriguez", idNumber: "V-12.345.678", description: "Personal" },
      { id: 'bd1002', bank: "Mercantil", accountNumber: "0105-0001-0001-0001-0001", accountHolder: "Ana Rodriguez", idNumber: "V-12.345.678" }
    ],
    expenses: [
      { id: 'exp1', date: '2024-05-01', description: 'Alquiler de consultorio', amount: 500 },
      { id: 'exp2', date: '2024-05-10', description: 'Materiales médicos', amount: 150 },
    ],
    coupons: [
      { 
        id: 'coupondoc1', 
        code: 'ANAFIRST', 
        description: '15% de descuento en tu primera consulta',
        discountType: 'percentage', 
        discountValue: 15, 
        validFrom: createFirestoreTimestamp(new Date()),
        validTo: createFirestoreTimestamp(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        isActive: true,
        createdAt: createFirestoreTimestamp(new Date()),
        updatedAt: createFirestoreTimestamp(new Date()),
        scopeType: 'specific',
        scopeDoctors: ['1'],
        scope: '1',
        value: 15
      }
    ],
    slotDuration: 30,
    consultationFee: 20,
    schedule: {
        monday: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        tuesday: { active: true, slots: [{ start: "09:00", end: "13:00" }] },
        wednesday: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        thursday: { active: false, slots: [] },
        friday: { active: true, slots: [{ start: "09:00", end: "15:00" }] },
        saturday: { active: false, slots: [] },
        sunday: { active: false, slots: [] },
    },
    sellerId: '1',
    status: 'active',
    lastPaymentDate: '2024-05-28',
    email: 'doctor@admin.com',
    password: '1234',
    whatsapp: '0414-1234567',
    lat: 10.4996,
    lng: -66.8528,
    joinDate: '2024-02-01',
    subscriptionStatus: 'active',
    nextPaymentDate: '2024-03-01',
  },
  { 
    id: '2', 
    name: "Dr. Carlos Sanchez", 
    cedula: "V-10.987.654",
    specialty: "Dermatología", 
    city: "Maracaibo", 
    address: "Calle 72 con Av. 3H, Edificio Profesional",
    sector: "Tierra Negra",
    rating: 4.8, 
    reviewCount: 98, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png", 
    aiHint: "man doctor",
    description: "Especialista en dermatología clínica y estética, enfocado en ofrecer tratamientos personalizados para el cuidado de la piel. Miembro activo de la Sociedad Venezolana de Dermatología.",
    services: [
      { id: 's201', name: "Consulta Dermatológica", price: 45 },
      { id: 's202', name: "Crioterapia (verrugas)", price: 60 },
    ],
    bankDetails: [{ id: 'bd2001', bank: "Banco de Venezuela", accountNumber: "0102-0002-0002-0002-0002", accountHolder: "Carlos Sanchez", idNumber: "V-10.987.654" }],
    expenses: [],
    coupons: [],
    slotDuration: 60,
    consultationFee: 25,
    schedule: defaultSchedule,
    sellerId: '1',
    status: 'active',
    lastPaymentDate: '2024-05-25',
    email: 'carlos.sanchez.dr@email.com',
    password: '1234',
    whatsapp: '0412-2345678',
    lat: 10.6667,
    lng: -71.6125,
    joinDate: '2024-02-15',
    subscriptionStatus: 'active',
    nextPaymentDate: '2024-04-01',
  },
  { 
    id: '3', 
    name: "Dr. Sofia Gomez", 
    cedula: "V-14.567.890",
    specialty: "Neurología", 
    city: "Valencia", 
    address: "Av. Monseñor Adams, Centro Médico El Viñedo",
    sector: "El Viñedo",
    rating: 4.9, 
    reviewCount: 150, 
    profileImage: "https://placehold.co/400x400.png",
    bannerImage: "https://placehold.co/1200x400.png",
    aiHint: "doctor smile",
    description: "Neuróloga dedicada al estudio y tratamiento de trastornos del sistema nervioso. Experiencia en migrañas, epilepsia y enfermedades neurodegenerativas.",
    services: [ { id: 's301', name: "Consulta Neurológica", price: 60 } ],
    bankDetails: [{ id: 'bd3001', bank: "BBVA Provincial", accountNumber: "0108-0003-0003-0003-0003", accountHolder: "Sofia Gomez", idNumber: "V-14.567.890" }],
    expenses: [],
    coupons: [],
    slotDuration: 30,
    consultationFee: 30,
    schedule: defaultSchedule,
    sellerId: '2',
    status: 'inactive',
    lastPaymentDate: '2024-03-15',
    email: 'sofia.gomez.dr@email.com',
    password: '1234',
    whatsapp: '0424-3456789',
    lat: 10.2117,
    lng: -68.0019,
    joinDate: '2024-03-05',
    subscriptionStatus: 'inactive',
    nextPaymentDate: '2024-04-01',
  },
];


export const mockPatients: Patient[] = [
    { id: "pat1", name: "Elena Ríos", email: "elena.r@example.com", password: "1234", age: 34, gender: 'femenino', phone: '0414-1112233', cedula: 'V-18.123.456', favoriteDoctorIds: ['1'], city: 'Caracas', profileImage: 'https://placehold.co/100x100.png' },
    { id: "pat2", name: "Jorge Paez", email: "jorge.p@example.com", password: "1234", age: 45, gender: 'masculino', phone: '0412-2223344', cedula: 'V-12.345.678', favoriteDoctorIds: [], city: 'Maracaibo', profileImage: 'https://placehold.co/100x100.png' },
    { id: "pat3", name: "Maria Castillo", email: "maria.c@example.com", password: "1234", age: 29, gender: 'femenino', phone: '0416-3334455', cedula: 'V-20.987.654', favoriteDoctorIds: [], city: 'Valencia', profileImage: 'https://placehold.co/100x100.png' },
    { id: "pat4", name: "Carlos Briceño", email: "carlos.b@example.com", password: "1234", age: 52, gender: 'masculino', phone: '0424-4445566', cedula: 'V-9.876.543', favoriteDoctorIds: [], city: 'Caracas', profileImage: 'https://placehold.co/100x100.png' },
    { id: "pat5", name: "Paciente de Prueba", email: "paciente@example.com", password: "1234", age: 40, gender: 'masculino', phone: '0426-5556677', cedula: 'V-15.555.555', favoriteDoctorIds: ['1', '2'], city: 'Caracas', profileImage: 'https://placehold.co/100x100.png' },
    { id: "pat6", name: "Luis Ramirez", email: "luis.r@example.com", password: "1234", age: 60, gender: 'masculino', phone: '0412-5556677', cedula: 'V-6.543.210', favoriteDoctorIds: [], city: 'Maracaibo', profileImage: 'https://placehold.co/100x100.png' },
];


export const appointments: Appointment[] = [
  {
    id: "appt1", patientId: "pat1", patientName: "Elena Ríos", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], time: "10:00",
    services: [ { id: 's102', name: "Electrocardiograma (EKG)", price: 30 } ],
    consultationFee: 50,
    totalPrice: 80, 
    paymentMethod: 'transferencia', paymentStatus: 'Pendiente', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: 'Tomar 1 pastilla de Losartán Potásico cada 12 horas. Repetir EKG en 3 meses.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt2", patientId: "pat2", patientName: "Jorge Paez", doctorName: "Dr. Carlos Sanchez", doctorId: '2',
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], time: "14:00",
    services: [ { id: 's202', name: "Crioterapia (verrugas)", price: 60 } ],
    consultationFee: 45,
    totalPrice: 105, 
    paymentMethod: 'efectivo', paymentStatus: 'Pendiente', paymentProof: null,
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: '', readByDoctor: true, readByPatient: true,
  },
  // Citas adicionales con pago en efectivo para probar
  {
    id: "appt13", patientId: "pat4", patientName: "Carlos Briceño", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], time: "16:00",
    services: [ { id: 's101', name: "Consulta Cardiológica", price: 50 } ],
    consultationFee: 50,
    totalPrice: 100, 
    paymentMethod: 'efectivo', paymentStatus: 'Pendiente', paymentProof: null,
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: '', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt14", patientId: "pat3", patientName: "Maria Castillo", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split('T')[0], time: "11:30",
    services: [ { id: 's102', name: "Electrocardiograma (EKG)", price: 30 } ],
    consultationFee: 50,
    totalPrice: 80, 
    paymentMethod: 'efectivo', paymentStatus: 'Pendiente', paymentProof: null,
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: '', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt3", patientId: "pat3", patientName: "Maria Castillo", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], time: "09:00",
    services: [ { id: 's103', name: "Ecocardiograma", price: 80 } ],
    consultationFee: 50,
    totalPrice: 130, 
    paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Pendiente', patientConfirmationStatus: 'Pendiente', clinicalNotes: '', prescription: '', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt4", patientId: "pat6", patientName: "Luis Ramirez", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], time: "11:00",
    services: [],
    consultationFee: 50,
    totalPrice: 50, 
    paymentMethod: 'efectivo', paymentStatus: 'Pagado', paymentProof: null,
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Paciente presenta arritmia leve, se recomienda seguimiento y control de estrés.',
    prescription: 'Concor 2.5mg, 1 al día.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt5", patientId: "pat5", patientName: "Paciente de Prueba", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0], time: "14:00",
    services: [],
    consultationFee: 50,
    totalPrice: 50, 
    paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'No Asistió', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'El paciente no asistió a la cita. Contactar para reprogramar.', prescription: '', readByDoctor: true, readByPatient: true,
  },
  // Nuevas citas para mostrar historial de ingresos
  {
    id: "appt6", patientId: "pat1", patientName: "Elena Ríos", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], time: "09:00",
    services: [ { id: 's101', name: "Consulta Cardiológica", price: 50 } ],
    consultationFee: 50,
    totalPrice: 100, 
    paymentMethod: 'efectivo', paymentStatus: 'Pagado', paymentProof: null,
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Consulta de control, paciente estable.', prescription: 'Continuar tratamiento actual.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt7", patientId: "pat4", patientName: "Carlos Briceño", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], time: "15:00",
    services: [ { id: 's102', name: "Electrocardiograma (EKG)", price: 30 } ],
    consultationFee: 50,
    totalPrice: 80, 
    paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'EKG normal, continuar monitoreo.', prescription: 'Mantener medicación actual.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt8", patientId: "pat3", patientName: "Maria Castillo", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], time: "10:30",
    services: [ { id: 's103', name: "Ecocardiograma", price: 80 } ],
    consultationFee: 50,
    totalPrice: 130, 
    paymentMethod: 'efectivo', paymentStatus: 'Pagado', paymentProof: null,
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Ecocardiograma normal, función cardíaca preservada.', prescription: 'Continuar tratamiento preventivo.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt9", patientId: "pat2", patientName: "Jorge Paez", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0], time: "16:00",
    services: [],
    consultationFee: 50,
    totalPrice: 50, 
    paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Consulta de seguimiento, evolución favorable.', prescription: 'Ajustar dosis de medicación.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt10", patientId: "pat5", patientName: "Paciente de Prueba", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 21)).toISOString().split('T')[0], time: "11:30",
    services: [ { id: 's101', name: "Consulta Cardiológica", price: 50 } ],
    consultationFee: 50,
    totalPrice: 100, 
    paymentMethod: 'efectivo', paymentStatus: 'Pagado', paymentProof: null,
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Primera consulta, evaluación inicial completa.', prescription: 'Iniciar tratamiento según protocolo.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt11", patientId: "pat6", patientName: "Luis Ramirez", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 28)).toISOString().split('T')[0], time: "14:30",
    services: [ { id: 's102', name: "Electrocardiograma (EKG)", price: 30 } ],
    consultationFee: 50,
    totalPrice: 80, 
    paymentMethod: 'transferencia', paymentStatus: 'Pagado', paymentProof: 'https://placehold.co/400x200.png',
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Control rutinario, EKG sin cambios.', prescription: 'Mantener tratamiento actual.', readByDoctor: true, readByPatient: true,
  },
  {
    id: "appt12", patientId: "pat1", patientName: "Elena Ríos", doctorName: "Dr. Ana Rodriguez", doctorId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 35)).toISOString().split('T')[0], time: "09:15",
    services: [ { id: 's103', name: "Ecocardiograma", price: 80 } ],
    consultationFee: 50,
    totalPrice: 130, 
    paymentMethod: 'efectivo', paymentStatus: 'Pagado', paymentProof: null,
    attendance: 'Atendido', patientConfirmationStatus: 'Confirmada', clinicalNotes: 'Ecocardiograma de control anual, normal.', prescription: 'Continuar medicación preventiva.', readByDoctor: true, readByPatient: true,
  },
];

export const mockSellerPayments: SellerPayment[] = [
  {
    id: 'pay1', sellerId: '1', paymentDate: '2024-05-16', amount: 18, period: 'Abril 2024',
    includedDoctors: [ 
        { id: '1', name: "Dr. Ana Rodriguez", commissionAmount: 10 }, 
        { id: '2', name: "Dr. Carlos Sanchez", commissionAmount: 8 } 
    ],
    paymentProofUrl: 'https://placehold.co/400x300.png', transactionId: 'TXN-SUMA-20240516-001',
    status: 'paid'
  },
  {
    id: 'pay2', sellerId: '1', paymentDate: '2024-04-16', amount: 20.00, period: 'Marzo 2024',
    includedDoctors: [ 
        { id: '1', name: "Dr. Ana Rodriguez", commissionAmount: 10 }, 
        { id: '2', name: "Dr. Carlos Sanchez", commissionAmount: 8 },
        { id: '3', name: "Dr. Sofia Gomez", commissionAmount: 2 } 
    ],
    paymentProofUrl: 'https://placehold.co/400x300.png', transactionId: 'TXN-SUMA-20240416-001',
    status: 'paid'
  },
];

export const marketingMaterials: MarketingMaterial[] = [];

export const mockDoctorPayments: DoctorPayment[] = [
  { id: 'dp1', doctorId: '1', doctorName: 'Dr. Ana Rodriguez', date: '2024-05-28', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123456', readByAdmin: true },
  { id: 'dp2', doctorId: '2', doctorName: 'Dr. Carlos Sanchez', date: '2024-05-25', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123457', readByAdmin: true },
  { id: 'dp3', doctorId: '4', doctorName: 'Dr. Luis Fernandez', date: '2024-05-29', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123458', readByAdmin: true },
  { id: 'dp4', doctorId: '7', doctorName: 'Dra. Laura Montes', date: '2024-05-22', amount: 50, status: 'Paid', paymentProofUrl: 'https://placehold.co/400x200.png', transactionId: 'TXN123459', readByAdmin: true },
  { id: 'dp5', doctorId: '3', doctorName: 'Dr. Sofia Gomez', date: '2024-06-01', amount: 50, status: 'Pending', paymentProofUrl: 'https://placehold.co/400x300.png', transactionId: 'TXN123460', readByAdmin: false },
];


export const mockAdminSupportTickets: AdminSupportTicket[] = [
    { id: 'ticketadmin1', userId: 'vendedora@venta.com', userName: 'Vendedora Principal', userRole: 'seller', subject: 'Problema con la comisión de un referido', description: 'No estoy segura de cómo se calcula la comisión para uno de mis médicos.', status: 'abierto', date: '2024-05-20', readByAdmin: false, messages: [], readBySeller: true },
    { id: 'ticketadmin2', userId: 'doctor@admin.com', userName: 'Dr. Ana Rodriguez', userRole: 'doctor', subject: 'Duda sobre el horario de trabajo', description: '¿Cómo puedo bloquear un día completo en mi calendario?', status: 'abierto', date: '2024-05-28', readByAdmin: false, messages: [], readByDoctor: true },
    { id: 'ticketadmin3', userId: 'vendedora@venta.com', userName: 'Vendedora Principal', userRole: 'seller', subject: 'Cómo actualizar los datos de un médico', description: 'Necesito cambiar el número de teléfono de uno de mis médicos referidos.', status: 'cerrado', date: '2024-05-15', readByAdmin: true, messages: [], readBySeller: true },
];

const mockCompanyExpenses: AppSettings['companyExpenses'] = [
    { id: 'cexp1', date: '2024-05-01', description: 'Alquiler de oficina', amount: 800, category: 'operativo' },
    { id: 'cexp2', date: '2024-05-10', description: 'Campaña de publicidad en redes', amount: 250, category: 'marketing' },
    { id: 'cexp3', date: '2024-05-15', description: 'Nómina - Administrador', amount: 1200, category: 'personal' },
    { id: 'cexp4', date: '2024-05-25', description: 'Pago de servicios (internet, luz)', amount: 150, category: 'operativo' },
];

export const mockSettings: AppSettings = {
    cities: cities,
    specialties: specialties,
    companyBankDetails: mockCompanyBankDetails,
    companyExpenses: mockCompanyExpenses,
    coupons: mockCoupons,
    timezone: 'America/Caracas',
    logoUrl: 'https://placehold.co/150x50.png',
    heroImageUrl: 'https://placehold.co/1200x600.png',
    currency: 'USD',
    beautySpecialties: ["Medicina Estética"],
    billingCycleStartDay: 1,
    billingCycleEndDay: 6,
};
