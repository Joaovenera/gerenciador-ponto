import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date, formatStr: string = "dd/MM/yyyy"): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, formatStr, { locale: ptBR });
  } catch (error) {
    return "Data inválida";
  }
}

export function formatTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, "HH:mm:ss", { locale: ptBR });
  } catch (error) {
    return "Horário inválido";
  }
}

export function formatDateTime(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  } catch (error) {
    return "Data/hora inválida";
  }
}

export function formatDateWithWeekday(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    return "Data inválida";
  }
}

export function getWeekdayName(dateString: string | Date): string {
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
    return format(date, "EEEE", { locale: ptBR });
  } catch (error) {
    return "Dia inválido";
  }
}

export function createGoogleMapsLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function getCurrentTime(): string {
  return format(new Date(), "HH:mm:ss", { locale: ptBR });
}

export function getCurrentDate(): string {
  return format(new Date(), "dd/MM/yyyy", { locale: ptBR });
}

export function getCurrentDateTime(): string {
  return format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
}

export function getCurrentDateWithWeekday(): string {
  return format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getStatusColor(status: "active" | "inactive" | string): string {
  return status === "active" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100";
}

export function getStatusClass(status: "active" | "inactive" | string): string {
  return status === "active" 
    ? "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800" 
    : "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800";
}

export function getTypeIcon(type: "in" | "out" | string): string {
  return type === "in" ? "sign-in" : "sign-out";
}

export function getTypeColor(type: "in" | "out" | string): string {
  return type === "in" ? "text-blue-600 bg-blue-100" : "text-red-600 bg-red-100";
}

export function formatCPF(cpf: string): string {
  if (!cpf) return "";
  
  // Remove non-numeric characters
  const numericCPF = cpf.replace(/\D/g, "");
  
  // Apply formatting if we have enough digits
  if (numericCPF.length === 11) {
    return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  
  return cpf;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove non-numeric characters
  const numericPhone = phone.replace(/\D/g, "");
  
  // Apply formatting based on length
  if (numericPhone.length === 11) {
    return numericPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (numericPhone.length === 10) {
    return numericPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  return phone;
}

export function calculateTotalHours(records: any[]): string {
  if (!records || records.length === 0) return '00:00';
  
  let totalMinutes = 0;
  let inTime: Date | null = null;
  
  // Sort records by timestamp
  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  for (const record of sortedRecords) {
    if (record.type === 'in') {
      inTime = new Date(record.timestamp);
    } else if (record.type === 'out' && inTime) {
      const outTime = new Date(record.timestamp);
      const diffMinutes = Math.round((outTime.getTime() - inTime.getTime()) / 60000);
      totalMinutes += diffMinutes;
      inTime = null;
    }
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
