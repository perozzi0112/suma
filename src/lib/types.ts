
import { Timestamp } from "firebase/firestore";

export type ChatMessage = {
    id: string;
    sender: 'user' | 'admin' | 'patient' | 'doctor';
    text: string;
    timestamp: string; // ISO string
};

export type BankDetail = {
  id: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  idNumber: string;
  description?: string | null;
};

export type Service = {
  id: string;
  name: string;
  price: number;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  scope: 'general' | string; // 'general' or doctorId
};

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
};

export type DaySchedule = {
  active: boolean;
  slots: { start: string; end: string }[];
};

export type Schedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export type Doctor = {
  id: string;
  name: string;
  cedula: string;
  specialty: string;
  city: string;
  address: string;
  sector: string;
  rating: number;
  reviewCount: number;
  profileImage: string;
  bannerImage: string;
  aiHint: string;
  description: string;
  services: Service[];
  bankDetails: BankDetail[];
  expenses: Expense[];
  coupons: Coupon[];
  schedule: Schedule;
  slotDuration: number;
  consultationFee: number;
  sellerId: string | null;
  status: 'active' | 'inactive';
  lastPaymentDate: string;
  email: string;
  password: string;
  whatsapp: string;
  lat: number;
  lng: number;
  joinDate: string;
  subscriptionStatus: 'active' | 'inactive' | 'pending_payment';
  nextPaymentDate: string;
  readByAdmin?: boolean;
  readBySeller?: boolean;
};

export type Seller = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  profileImage: string;
  referralCode: string;
  bankDetails: BankDetail[];
  commissionRate: number;
  expenses?: Expense[];
};

export type Patient = {
    id: string;
    name: string;
    email: string;
    password: string;
    age: number | null;
    gender: 'masculino' | 'femenino' | 'otro' | null;
    phone: string | null;
    cedula: string | null;
    city: string | null;
    favoriteDoctorIds?: string[];
    profileImage: string | null;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  services: Service[];
  totalPrice: number;
  consultationFee: number;
  paymentMethod: 'efectivo' | 'transferencia';
  paymentStatus: 'Pendiente' | 'Pagado';
  paymentProof: string | null;
  attendance: 'Atendido' | 'No Asistió' | 'Pendiente';
  patientConfirmationStatus: 'Pendiente' | 'Confirmada' | 'Cancelada';
  clinicalNotes?: string;
  prescription?: string;
  messages?: ChatMessage[];
  readByDoctor?: boolean;
  readByPatient?: boolean;
};

export type IncludedDoctorCommission = {
  id: string;
  name: string;
  commissionAmount: number;
};

export type SellerPayment = {
  id: string;
  sellerId: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  period: string; // e.g., "Mayo 2024"
  includedDoctors: IncludedDoctorCommission[];
  paymentProofUrl: string;
  transactionId: string;
  readBySeller?: boolean;
};

export type MarketingMaterial = {
    id: string;
    type: 'image' | 'video' | 'file' | 'url';
    title: string;
    description: string;
    url: string;
    thumbnailUrl: string;
};

export type DoctorPayment = {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Rejected';
  paymentProofUrl: string | null;
  transactionId: string;
  readByAdmin?: boolean;
  readByDoctor?: boolean;
};


export type AdminSupportTicket = {
    id: string;
    userId: string; 
    userName: string;
    userRole: 'doctor' | 'seller';
    subject: string;
    description: string;
    status: 'abierto' | 'cerrado';
    date: string;
    messages?: ChatMessage[];
    readByAdmin?: boolean;
    readBySeller?: boolean;
    readByDoctor?: boolean;
};

export type AdminNotification = {
    id: string;
    type: 'payment' | 'new_doctor' | 'support_ticket';
    title: string;
    description: string;
    date: string; // ISO string
    read: boolean;
    link: string;
};

export type PatientNotification = {
    id: string;
    type: 'reminder' | 'payment_approved' | 'new_message' | 'record_added' | 'attendance_marked';
    appointmentId: string;
    title: string;
    description: string;
    date: string; // ISO string of the event
    read: boolean;
    createdAt: string; // ISO string to sort and manage notifications
    link: string;
};

export type DoctorNotification = {
    id: string;
    type: 'new_appointment' |'payment_verification' | 'support_reply' | 'subscription_update' | 'new_message' | 'patient_confirmed' | 'patient_cancelled';
    title: string;
    description: string;
    date: string; // ISO string of the event
    createdAt: string; // ISO string of notification creation
    read: boolean;
    link: string;
};

export type SellerNotification = {
    id: string;
    type: 'payment_processed' | 'support_reply' | 'new_doctor_registered';
    title: string;
    description: string;
    date: string; // ISO string of the event
    createdAt: string; // ISO string of notification creation
    read: boolean;
    link: string;
};

export type CompanyExpense = {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
    category: 'operativo' | 'marketing' | 'personal';
};

export type City = {
    name: string;
    subscriptionFee: number;
};

// For settings document in Firestore
export type AppSettings = {
    cities: City[];
    specialties: string[];
    companyBankDetails: BankDetail[];
    timezone: string;
    logoUrl: string;
    currency: string;
    beautySpecialties?: string[];
    heroImageUrl?: string;
    billingCycleStartDay?: number;
    billingCycleEndDay?: number;
    coupons: Coupon[];
    companyExpenses: CompanyExpense[];
}
