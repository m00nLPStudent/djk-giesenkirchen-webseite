import Image from "next/image";
import { buildInitials } from "../helpers/users.formatters";

export default function UserAvatar({ user, size = "md" }) {
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  if (user?.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={`Avatar von ${user.name}`}
        width={44}
        height={44}
        className={`${sizeClass} rounded-xl border border-white/10 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] font-black uppercase tracking-[0.08em] text-white/80`}
      aria-hidden
    >
      {buildInitials(user?.name, user?.email)}
    </div>
  );
}
