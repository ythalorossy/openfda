/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';

/**
 * The drug API group. Every entry is checked by tests/catalog-conformance
 * against FDA's own published field list, so a field name that FDA does not
 * publish cannot reach a tool schema.
 */
export const DRUG_ENDPOINTS: EndpointDescriptor[] = [];
