import TrainingExceptionCard from "./TrainingExceptionCard";

export default function TrainingExceptionsList({
  items,
  trainingTimeMap,
  trainingTimes,
  onDelete,
  onFieldChange,
  onPersist,
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <TrainingExceptionCard
          key={item.id}
          item={item}
          trainingTime={trainingTimeMap.get(item.team_training_time_id)}
          trainingTimes={trainingTimes}
          onDelete={() => onDelete(item)}
          onFieldChange={(field, value) => onFieldChange(item.id, field, value)}
          onPersist={onPersist}
        />
      ))}
    </div>
  );
}
