export default function MembershipPersonalData({
  form,
  requestTypeOptions,
  inputClassName,
  FormField,
  onUpdateField,
}) {
  return (
    <>
      <FormField label="Vorname" required>
        <input
          className={inputClassName}
          value={form.first_name}
          onChange={(event) => onUpdateField("first_name", event.target.value)}
        />
      </FormField>

      <FormField label="Nachname" required>
        <input
          className={inputClassName}
          value={form.last_name}
          onChange={(event) => onUpdateField("last_name", event.target.value)}
        />
      </FormField>

      <FormField label="Telefonnummer">
        <input
          className={inputClassName}
          value={form.phone}
          onChange={(event) => onUpdateField("phone", event.target.value)}
        />
      </FormField>

      <FormField label="Geburtsdatum" required>
        <input
          type="date"
          className={inputClassName}
          value={form.birthdate}
          onChange={(event) => onUpdateField("birthdate", event.target.value)}
        />
      </FormField>

      <FormField label="E-Mail" required>
        <input
          type="email"
          className={inputClassName}
          value={form.email}
          onChange={(event) => onUpdateField("email", event.target.value)}
        />
      </FormField>

      <FormField label="Art der Anfrage" required>
        <select
          className={inputClassName}
          value={form.request_type}
          onChange={(event) =>
            onUpdateField("request_type", event.target.value)
          }
        >
          {requestTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}
