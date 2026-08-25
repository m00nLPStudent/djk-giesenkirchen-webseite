"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { deleteSponsorAction } from "@/app/admin/sponsors/actions";

export default function SponsorDeleteButton({ sponsor }) {
  return <AdminRemoveButton label="Sponsor" name={sponsor.name} action={() => deleteSponsorAction(sponsor.id)} affected={["Sponsor"]} preserved={["News", "Mannschaften", "Trainer", "zentrale Medien"]} successHref="/admin/sponsors" />;
}
