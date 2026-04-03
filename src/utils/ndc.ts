/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export function normalizeNDC(ndc: string): {
  productNDC: string;
  packageNDC: string | null;
  isValid: boolean;
} {
  const cleanNDC = ndc.trim().toUpperCase();

  let productNDC: string;
  let packageNDC: string | null = null;

  if (cleanNDC.includes('-')) {
    const parts = cleanNDC.split('-');

    if (parts.length === 2) {
      productNDC = cleanNDC;
      packageNDC = null;
    } else if (parts.length === 3) {
      productNDC = `${parts[0]}-${parts[1]}`;
      packageNDC = cleanNDC;
    } else {
      return { productNDC: cleanNDC, packageNDC: null, isValid: false };
    }
  } else {
    if (cleanNDC.length === 11) {
      productNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}`;
      packageNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}-${cleanNDC.substring(9, 11)}`;
    } else if (cleanNDC.length === 9) {
      productNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}`;
      packageNDC = null;
    } else {
      return { productNDC: cleanNDC, packageNDC: null, isValid: false };
    }
  }

  const isValid = /^\d{5}-\d{4}$/.test(productNDC);

  return { productNDC, packageNDC, isValid };
}
