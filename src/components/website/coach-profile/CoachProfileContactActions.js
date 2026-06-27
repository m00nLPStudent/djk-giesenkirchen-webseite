import { Mail, Phone } from "lucide-react";

function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 448 512" aria-hidden="true" className={className}>
      <path
        fill="#25D366"
        d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.1 32 1.4 131.8 1.4 254.6c0 39.1 10.2 77.3 29.6 111L0 480l117.3-30.8c32.5 17.7 69.1 27 106.5 27h.1c122.8 0 222.6-99.8 222.6-222.6.1-59.4-23-115.1-65.6-156.5z"
      />
      <path
        fill="#FFFFFF"
        d="M223.9 438.7h-.1c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.6 18.3 18.6-67.9-4.4-7c-18.5-29.4-28.2-63.3-28.2-97.8 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.7-84.9 184-186.7 184zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.5-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.5-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
      />
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
    <span className="inline-flex shrink-0 items-center gap-2">
      <ActionIcon href={contact?.phoneHref} label="Trainer anrufen">
        <Phone size={18} />
      </ActionIcon>

      <ActionIcon href={email ? `mailto:${email}` : null} label="E-Mail schreiben">
        <Mail size={18} />
      </ActionIcon>

      <ActionIcon
        href={contact?.whatsappHref}
        label="WhatsApp öffnen"
        className="border-[#25D366]/40 bg-[#25D366]/15 hover:border-[#25D366] hover:bg-[#25D366]/25"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </ActionIcon>
    </span>
  );
}
