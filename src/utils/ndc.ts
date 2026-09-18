/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

// A product NDC is 5-4 or 5-3; a package NDC appends a 1-2 digit suffix.
const PRODUCT_NDC = /^\d{5}-\d{3,4}$/;
const PACKAGE_SUFFIX = /^\d{1,2}$/;

export function normalizeNDC(ndc: string): {
  productNDC: string;
  packageNDC: string | null;
  isValid: boolean;
} {
  const cleanNDC = ndc.trim().toUpperCase();
  const invalid = { productNDC: cleanNDC, packageNDC: null, isValid: false };

  let productNDC: string;
  let packageNDC: string | null = null;

  if (cleanNDC.includes('-')) {
    const parts = cleanNDC.split('-');

    if (parts.length === 2) {
      productNDC = cleanNDC;
    } else if (parts.length === 3) {
      const suffix = parts[2];
      if (!suffix || !PACKAGE_SUFFIX.test(suffix)) return invalid;
      productNDC = `${parts[0]}-${parts[1]}`;
      packageNDC = cleanNDC;
    } else {
      return invalid;
    }
  } else if (/^\d+$/.test(cleanNDC)) {
    // Undashed forms. 10 digits is deliberately unsupported: 4-4-2, 5-3-2
    // and 5-4-1 are all ten digits, so segmenting it would be a guess.
    if (cleanNDC.length === 11) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`;
      packageNDC = `${productNDC}-${cleanNDC.slice(9, 11)}`;
    } else if (cleanNDC.length === 9) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`;
    } else if (cleanNDC.length === 8) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}`;
    } else {
      return invalid;
    }
  } else {
    return invalid;
  }

  if (!PRODUCT_NDC.test(productNDC)) return invalid;

  return { productNDC, packageNDC, isValid: true };
}
