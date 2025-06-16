// File: src/hooks/useStructuredFilters.ts

import { useState } from "react";
import type { StructuredFilters } from "@/lib/types";

export function useStructuredFilters(initial: StructuredFilters) {
  const [filters, setFilters] = useState<StructuredFilters>(initial);

  function setField<K extends keyof StructuredFilters>(
    field: K,
    value: StructuredFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const errors: Record<string, string> = {};

    // budget
    if (filters.budgetMin < 0 || filters.budgetMax < filters.budgetMin) {
      errors.budget = "Budget range is invalid";
    }

    // location
    const loc = filters.location;
    if (
      !loc ||
      typeof loc.lat !== "number" ||
      typeof loc.lng !== "number"
    ) {
      errors.location = "Location is required";
    }

    // bedrooms & bathrooms (if present)
    if (filters.bedrooms !== undefined && filters.bedrooms < 0) {
      errors.bedrooms = "Bedrooms must be ≥ 0";
    }
    if (filters.bathrooms !== undefined && filters.bathrooms < 0) {
      errors.bathrooms = "Bathrooms must be ≥ 0";
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  return { filters, setField, validate };
}
