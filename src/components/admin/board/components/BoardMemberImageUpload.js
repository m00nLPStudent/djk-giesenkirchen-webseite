import { AdminImageUpload } from "@/components/admin/media";
import { BOARD_PLACEHOLDER_IMAGE } from "../services/board.service";

export default function BoardMemberImageUpload(props) {
  return (
    <AdminImageUpload
      {...props}
      placeholderUrl={BOARD_PLACEHOLDER_IMAGE}
      alt="Vorstandsbild"
      description="Profilbild für die öffentliche Abteilungsseite."
      uploadLabel="Bild auswählen"
      removeLabel="Bild entfernen"
    />
  );
}
