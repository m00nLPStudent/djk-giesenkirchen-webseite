import AdminSearch from "./AdminSearch";
import AdminTopbarClock from "./AdminTopbarClock";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import WebsiteButton from "./WebsiteButton";

export default function AdminTopbar() {
  return (
    <header className="border-b border-white/10 bg-[#0b0b0f]/95 px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <AdminSearch />

        <div className="ml-auto flex items-center gap-3">
          <AdminTopbarClock />
          <WebsiteButton />
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
