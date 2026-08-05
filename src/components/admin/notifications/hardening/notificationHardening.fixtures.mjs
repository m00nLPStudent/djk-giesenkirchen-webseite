export const users = Object.freeze({ actor:"user-actor", trainerA:"user-trainer-a", trainerB:"user-trainer-b", coachC:"user-coach-c", caretakerD:"user-caretaker-d", outsider:"user-outsider" });
export const teamRecipients = Object.freeze([users.trainerA,users.trainerB,users.coachC,users.caretakerD,users.trainerA]);
export const optionalPreferences = new Map([[`${users.trainerB}:player_assigned`,false],[`${users.caretakerD}:player_assigned`,false]]);
export const disabledMandatoryPreferences = new Map([[`${users.trainerA}:trainer_removed`,false],[`${users.trainerB}:trainer_removed`,false]]);
export const multiRoleRecipients = Object.freeze([{userId:users.trainerA,roles:["superadmin","trainer"]},{userId:users.trainerB,roles:["vorstand","trainer"]},{userId:users.trainerA,roles:["trainer"]}]);
