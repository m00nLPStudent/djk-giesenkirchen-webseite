"use client";

import { useState } from "react";
import { hasValidationErrors } from "@/components/admin/utils/validation";

export default function useEntityForm({ initialForm, validate }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: null }));
    }
  }

  function validateForm() {
    const nextErrors = validate ? validate(form) : {};
    setErrors(nextErrors);
    return nextErrors;
  }

  return {
    form,
    setForm,
    errors,
    setErrors,
    loading,
    setLoading,
    updateField,
    validateForm,
    hasErrors: hasValidationErrors(errors),
  };
}
