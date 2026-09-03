import { FormSection, TextareaField } from "@/components/admin/forms";
import TrainingExceptionsManager from "../../components/TrainingExceptionsManager";
import TrainingTimesManager from "../../components/TrainingTimesManager";

export default function TeamTrainingTab({ form, onFieldChange, departmentSlug = null }) {
  return (
    <FormSection eyebrow="Training" title="Trainingszeiten & Ausnahmen">
      <div className="space-y-8">
        <div className="space-y-4">
          <TextareaField
            label="Trainingszeiten Deutsch"
            rows={5}
            value={form.training_times_de}
            onChange={(event) =>
              onFieldChange("training_times_de", event.target.value)
            }
          />
        </div>

        <TrainingTimesManager teamSeasonId={form.team_season_id} departmentSlug={departmentSlug} />
        <TrainingExceptionsManager teamSeasonId={form.team_season_id} />
      </div>
    </FormSection>
  );
}
