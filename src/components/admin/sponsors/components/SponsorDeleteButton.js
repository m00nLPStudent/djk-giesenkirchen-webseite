"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeSponsorRecord } from "@/components/admin/delete/removeActions";

export default function SponsorDeleteButton({ sponsor }) {
  return <AdminRemoveButton label="Sponsor" name={sponsor.name} action={() => removeSponsorRecord(sponsor)} affected={["Sponsor"]} preserved={["News", "Mannschaften", "Trainer"]} successHref="/admin/sponsors" />;
}
