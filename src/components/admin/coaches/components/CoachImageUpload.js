import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { AdminImageUpload } from "@/components/admin/media";

export default function CoachImageUpload({ placeholderUrl = COACH_PLACEHOLDER_IMAGE, ...props }) {
  return (
    <AdminImageUpload
      {...props}
      placeholderUrl={placeholderUrl}
      alt="Trainerbild"
    />
  );
}
