import { COUNTRIES } from "@/constants";
import { formatGermanPhoneNumberReadable, normalizeGermanPhoneNumber } from "@/lib/phone";
import { InputField, SelectField } from "./FormField";

export function EmailField({ value, onChange, error, required = false }) {
  return (
    <InputField
      label="E-Mail"
      required={required}
      placeholder="name@example.de"
      type="email"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
    />
  );
}

export function PhoneField({
  label = "Telefonnummer",
  value,
  onChange,
  error,
  required = false,
  placeholder = "01590...",
}) {
  return (
    <InputField
      label={label}
      required={required}
      placeholder={placeholder}
      value={formatGermanPhoneNumberReadable(value)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => onChange(normalizeGermanPhoneNumber(event.target.value))}
      error={error}
    />
  );
}

export function CountrySelectField({
  value,
  onChange,
  error,
  required = false,
  label = "Nationalität",
  options = COUNTRIES,
}) {
  return (
    <SelectField
      label={label}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
    >
      <option value="">{label} auswählen</option>
      {options.map((country) => (
        <option key={country.iso} value={country.iso}>
          {country.flag} {country.de}
        </option>
      ))}
    </SelectField>
  );
}
