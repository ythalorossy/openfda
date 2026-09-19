/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * One source of truth for what the NDC tools accept. Both tools render this,
 * so their messages cannot drift apart — get-drug-by-ndc previously listed
 * only the 5-4 shapes and would have told a caller that 58151-155 (the NDC
 * this server returns for Lipitor) was invalid.
 */
export const NDC_FORMATS = [
  '✅ Accepted formats:',
  '• 4-4 product NDC: 0456-4020',
  '• 5-3 product NDC: 58151-155',
  '• 5-4 product NDC: 12345-1234',
  '• Package NDC: 12345-1234-01 or 58151-155-01',
  '• Undashed 9 digits: 123451234 (read as 5-4)',
  '• Undashed 11 digits: 12345123401 (read as 5-4-2)',
  '',
  'Undashed 8- and 10-digit input is rejected because the split is ambiguous: 8 digits could be 5-3 or 4-4, and 10 could be 4-4-2, 5-3-2 or 5-4-1. Guessing could return a different drug, so add the dashes instead.',
].join('\n');

export const invalidNdcMessage = (input: string, label: string): string =>
  `Invalid ${label} format: "${input}"\n\n${NDC_FORMATS}`;
