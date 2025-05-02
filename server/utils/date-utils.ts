import { format as formatDateFns } from 'date-fns';
import { format, toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

// Configuração padrão para o timezone brasileiro
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data para o formato UTC preservando o timezone original
 * @param date Data a ser convertida
 * @param timezone Timezone (opcional, padrão é America/Sao_Paulo)
 * @returns Data em UTC
 */
export function toUTCWithTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return fromZonedTime(inputDate, timezone);
}

/**
 * Converte uma data UTC para o timezone especificado
 * @param date Data UTC a ser convertida
 * @param timezone Timezone (opcional, padrão é America/Sao_Paulo)
 * @returns Data no timezone especificado
 */
export function fromUTCToTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(inputDate, timezone);
}

/**
 * Formata uma data com timezone
 * @param date Data a ser formatada
 * @param formatStr String de formato
 * @param timezone Timezone (opcional, padrão é America/Sao_Paulo)
 * @returns String formatada com timezone
 */
export function formatWithTimezone(
  date: Date | string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Obtém a data e hora atual com timezone
 * @param timezone Timezone (opcional, padrão é America/Sao_Paulo)
 * @returns Data atual no timezone especificado
 */
export function getNowWithTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Gera string ISO a partir de uma data, preservando timezone
 * @param date Data a ser convertida
 * @param timezone Timezone (opcional, padrão é America/Sao_Paulo)
 * @returns String ISO com informação de timezone
 */
export function toISOStringWithTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(inputDate, timezone);
  
  return zonedDate.toISOString();
}

/**
 * Ajusta uma data para considerar o timezone corretamente
 * Útil em formulários onde a data é manipulada pelo usuário
 */
export function adjustDateWithTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  // Ajusta para o timezone correto considerando UTC
  return toZonedTime(fromZonedTime(inputDate, timezone), timezone);
}
