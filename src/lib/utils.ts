import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency conversion rate (1 USD = 5.20 BRL)
export const USD_TO_BRL_RATE = 5.20;

// Convert USD to BRL
export function usdToBrl(usdAmount: number): number {
  return usdAmount * USD_TO_BRL_RATE;
}

// Convert BRL to USD
export function brlToUsd(brlAmount: number): number {
  return brlAmount / USD_TO_BRL_RATE;
}

// Format currency in USD
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format currency in BRL
export function formatBRL(amount: number): string {
  return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

