import {
  Activity, BookOpen, Building2, CalendarDays, CalendarRange, CircleDot, Download,
  Contact, Handshake, HeartHandshake, Image, Inbox, KeyRound, Landmark,
  LayoutDashboard, LockKeyhole, Mail, Menu, Newspaper, Settings, Shield,
  Trophy, UserRound, Users, Wallet,
} from "lucide-react";

const ICONS = Object.freeze({
  activity: Activity,
  "book-open": BookOpen,
  "building-2": Building2,
  "calendar-days": CalendarDays,
  "calendar-range": CalendarRange,
  "circle-dot": CircleDot,
  contact: Contact,
  download: Download,
  handshake: Handshake,
  "heart-handshake": HeartHandshake,
  image: Image,
  inbox: Inbox,
  "key-round": KeyRound,
  landmark: Landmark,
  "layout-dashboard": LayoutDashboard,
  "lock-keyhole": LockKeyhole,
  mail: Mail,
  newspaper: Newspaper,
  settings: Settings,
  shield: Shield,
  trophy: Trophy,
  "user-round": UserRound,
  users: Users,
  wallet: Wallet,
});

export function getAdminNavigationIcon(iconKey) {
  return ICONS[iconKey] || Menu;
}

export const ADMIN_NAVIGATION_ICON_KEYS = Object.freeze(Object.keys(ICONS));
