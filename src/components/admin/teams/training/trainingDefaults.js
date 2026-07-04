export function createNewTrainingTime(teamSeasonId) {
  return {
    team_season_id: teamSeasonId,
    weekday: 1,
    start_time: "17:00",
    end_time: "18:45",
    training_type: "training",
    location_name: "Bezirkssportanlage Giesenkirchen",
    location_address: "Am Puffkohlen 80",
    location_city: "41238 Mönchengladbach",
    is_active: true,
    effective_from: "",
    effective_until: "",
    note: "",
  };
}

export function createNewException(teamTrainingTimeId) {
  const today = new Date().toISOString().slice(0, 10);

  return {
    team_training_time_id: teamTrainingTimeId,
    exception_date: today,
    exception_type: "cancelled",
    override_start_time: "",
    override_end_time: "",
    override_location_name: "",
    override_location_address: "",
    override_location_city: "",
    override_training_type: "",
    note: "",
    is_active: true,
  };
}
