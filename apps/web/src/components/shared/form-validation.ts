export type FieldRule = { required?: string; min?: { value: number; message: string }; pattern?: { regex: RegExp; message: string } };
export type ValidationRules<T> = Partial<Record<keyof T, FieldRule>>;

export function validateForm<T extends Record<string, any>>(
  values: Partial<T>,
  rules: ValidationRules<T>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const [field, rule] of Object.entries(rules)) {
    if (!rule) continue;
    const value = values[field];
    if (rule.required && (value === undefined || value === null || value === "" || (typeof value === "number" && isNaN(value)))) {
      errors[field as keyof T] = rule.required;
    } else if (rule.min && (value == null || Number(value) < rule.min.value)) {
      errors[field as keyof T] = rule.min.message;
    } else if (rule.pattern && value && !rule.pattern.regex.test(String(value))) {
      errors[field as keyof T] = rule.pattern.message;
    }
  }
  return errors;
}

export function clearFieldError<T>(
  field: keyof T,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
) {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}
