import AdminSearch from "./AdminSearch";
import AdminTopbarClock from "./AdminTopbarClock";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import WebsiteButton from "./WebsiteButton";

export default function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b0f]/92 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 items-center justify-between gap-3 xl:hidden">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">
              Admin-CMS
            </p>
            <p className="mt-1 truncate text-sm font-bold text-white/70">
              Schnellzugriff und Suche
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>

        <div className="min-w-0 xl:order-1">
          <AdminSearch />
        </div>

        <div className="hidden items-center justify-end gap-3 xl:flex xl:order-2">
          <AdminTopbarClock />
          <WebsiteButton />
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
