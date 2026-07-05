import { MEMBERSHIP_SUBVIEWS } from "../helpers/settingsOptions";
import SettingsToolbar from "./SettingsToolbar";

export default function MembershipSubviewTabs({ activeTab, onChange }) {
  return (
    <SettingsToolbar
      items={MEMBERSHIP_SUBVIEWS}
      activeId={activeTab}
      onChange={onChange}
    />
  );
}
