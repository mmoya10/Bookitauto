// Ajusta/añade campos si tu API tiene más, estos son mínimos para compilar.
export interface Calendar {
  id: string;
  name: string;
  categoryId?: string;
  duration?: number;
  price?: number;
  extrasSupported?: string[];
  color?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
  color?: string;
}

export interface BusinessHour {
  // Modelo mínimo compatible con FullCalendar
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
}

export interface Holiday {
  id: string;
  date: string; // ISO
  title?: string;
}

export interface Appointment {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  staffId?: string;
  calendarId?: string;
  status?: string;
  [k: string]: any;
}

export interface Absence {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  staffId?: string;
  [k: string]: any;
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  price?: number;
 salePrice?: number | null; 
}

export interface HolidayEvent {
  start: string;   // ISO
  end: string;     // ISO
  title?: string;
  display?: string;           // p.ej. "background"
  backgroundColor?: string;   // opcional
}