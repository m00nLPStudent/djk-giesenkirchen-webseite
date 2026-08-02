"use client";

import {
  FormGrid,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/admin/forms";
import { CONTRIBUTION_NATIVE_SELECT_CLASSNAME } from "../helpers/contributionSelectStyles.js";

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Zahlungsart optional" },
  { value: "cash", label: "Bar" },
  { value: "transfer", label: "Ueberweisung" },
  { value: "card", label: "Karte" },
  { value: "direct_debit", label: "Lastschrift" },
];

export default function PaymentForm({ form, errors = {}, onChange, maxAmount }) {
  return (
    <>
      <FormGrid>
        <InputField
          label="Betrag"
          required
          value={form.amount}
          onChange={(event) => onChange("amount", event.target.value)}
          error={errors.amount}
          placeholder={maxAmount ? `Maximal ${maxAmount}` : "0,00"}
        />
        <InputField
          label="Zahlungsdatum"
          required
          type="date"
          value={form.paidAt}
          onChange={(event) => onChange("paidAt", event.target.value)}
          error={errors.paidAt}
        />
        <SelectField
          label="Zahlungsart"
          value={form.paymentMethod}
          onChange={(event) => onChange("paymentMethod", event.target.value)}
          className={CONTRIBUTION_NATIVE_SELECT_CLASSNAME}
        >
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Referenz"
          value={form.reference}
          onChange={(event) => onChange("reference", event.target.value)}
          placeholder="Kassenbuch, IBAN-Ref, Beleg ..."
        />
      </FormGrid>

      <TextareaField
        label="Interne Notiz"
        rows={4}
        value={form.internalNotes}
        onChange={(event) => onChange("internalNotes", event.target.value)}
        placeholder="Optionaler interner Hinweis zur Zahlung"
      />
    </>
  );
}
