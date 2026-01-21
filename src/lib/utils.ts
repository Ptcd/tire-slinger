import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export function formatTireSize(w: number, ar: number, rd: number): string {
  return `${w}/${ar}R${rd}`
}

export function calculateDiameter(w: number, ar: number, rd: number): number {
  return rd + 2 * (w * ar / 100) / 25.4
}

export function isWithinTolerance(d1: number, d2: number, tol = 0.03): boolean {
  return Math.abs(d1 - d2) / d1 <= tol
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(d: string): string {
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// DOT date helpers (Phase 12)
export function dotToDate(week: number, year: number): Date {
  // ISO week to date: Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)
  const targetDate = new Date(firstMonday)
  targetDate.setDate(firstMonday.getDate() + (week - 1) * 7)
  return targetDate
}

export function getTireAgeYears(week: number, year: number): number {
  const manufactured = dotToDate(week, year)
  const now = new Date()
  return (now.getTime() - manufactured.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

export function getTireExpirationDate(week: number, year: number, maxAgeYears: number): Date {
  const manufactured = dotToDate(week, year)
  manufactured.setFullYear(manufactured.getFullYear() + maxAgeYears)
  return manufactured
}
