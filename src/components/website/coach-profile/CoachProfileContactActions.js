import { Mail, Phone } from "lucide-react";

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M16.04 3C9.45 3 4.08 8.36 4.08 14.95c0 2.11.55 4.17 1.61 5.98L4 29l8.27-1.63a11.93 11.93 0 0 0 5.77 1.47h.01C24.64 28.84 30 23.48 30 16.89 30 10.3 24.64 3 16.04 3Zm0 23.78h-.01c-1.83 0-3.63-.49-5.2-1.42l-.37-.22-4.9.97.99-4.78-.24-.39a9.86 9.86 0 0 1-1.52-5.24c0-5.45 4.43-9.88 9.88-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.87-9.87 9.87Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function ActionIcon({ href, label, children, className = "" }) {
  if (!href) return null;

  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-red-500 hover:bg-red-600 ${className}`}
    >
      {children}
    </a>
  );
}

export default function CoachProfileContactActions({ contact, email }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ActionIcon href={contact?.phoneHref} label="Trainer anrufen">
        <Phone size={18} />
      </ActionIcon>

      <ActionIcon href={email ? `mailto:${email}` : null} label="E-Mail schreiben">
        <Mail size={18} />
      </ActionIcon>

      <ActionIcon
        href={contact?.whatsappHref}
        label="WhatsApp öffnen"
        className="text-[#25D366] hover:text-white"
      >
        <WhatsAppIcon className="h-5 w-5" />
      </ActionIcon>
    </span>
  );
}
