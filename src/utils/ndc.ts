/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

// A product NDC is 4-4, 5-3 or 5-4 (openFDA emits all three — Celexa is 0456-4020,
// Lipitor is 58151-155); a package NDC appends a 1-2 digit suffix. 4-3 and 6-digit
// labeler segments are not real NDC formats and stay rejected.
const PRODUCT_NDC = /^(?:\d{4}-\d{4}|\d{5}-\d{3,4})$/;
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
    // Undashed forms assume a 5-DIGIT labeler; a caller with a 4-digit labeler must
    // dash it. Guessing wrong here does not merely 404 — the alternative split can be
    // a real NDC belonging to a DIFFERENT drug, so the tool would confidently return
    // the wrong label. Lengths are therefore accepted only where one reading clearly
    // dominates:
    //   11 -> 5-4-2, the only valid 11-digit split.
    //    9 -> 5-4 product. 4-4-1 is also 9 digits, but a bare product NDC is the far
    //         likelier input, and this length has been accepted since before 1.0.19.
    //    8 -> REJECTED. 5-3 and 4-4 are equally plausible and equally common
    //         (a sample of ~5,000 directory NDCs held 2,734 of the former and 477 of
    //         the latter), so there is no dominant reading to pick.
    //   10 -> REJECTED. 4-4-2, 5-3-2 and 5-4-1 are all ten digits.
    if (cleanNDC.length === 11) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`;
      packageNDC = `${productNDC}-${cleanNDC.slice(9, 11)}`;
    } else if (cleanNDC.length === 9) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`;
    } else {
      return invalid;
    }
  } else {
    return invalid;
  }

  if (!PRODUCT_NDC.test(productNDC)) return invalid;

  return { productNDC, packageNDC, isValid: true };
}
