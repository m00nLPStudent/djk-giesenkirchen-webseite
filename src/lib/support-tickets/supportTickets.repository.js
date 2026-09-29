import "server-only";

const TICKET_SELECT = "id,ticket_number,created_by_profile_id,category,area_key,department_id,team_id,subject,status,priority,assigned_to_profile_id,created_at,updated_at,last_activity_at,closed_at";

function applyTicketFilters(query, filters = {}) {
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.areaKey) query = query.eq("area_key", filters.areaKey);
  return query;
}

export function findOwnTickets(db, profileId, filters = {}) {
  return applyTicketFilters(db.from("support_tickets").select(TICKET_SELECT).eq("created_by_profile_id", profileId), filters)
    .order("last_activity_at", { ascending: false }).order("id");
}

export function findAllTicketsForSupport(db, filters = {}) {
  return applyTicketFilters(db.from("support_tickets").select(TICKET_SELECT), filters)
    .order("last_activity_at", { ascending: false }).order("id");
}

export function findTicketForOwner(db, ticketId, profileId) {
  return db.from("support_tickets").select(TICKET_SELECT).eq("id", ticketId).eq("created_by_profile_id", profileId).maybeSingle();
}

export function findTicketForSupport(db, ticketId) {
  return db.from("support_tickets").select(TICKET_SELECT).eq("id", ticketId).maybeSingle();
}

export function findMessagesForTicket(db, ticketId) {
  return db.from("support_ticket_messages").select("id,ticket_id,author_profile_id,body,created_at").eq("ticket_id", ticketId).order("created_at").order("id");
}

export function findEventsForTicket(db, ticketId) {
  return db.from("support_ticket_events").select("id,ticket_id,event_type,actor_profile_id,metadata,created_at").eq("ticket_id", ticketId).order("created_at").order("id");
}

export function findLatestStatusEvent(db, ticketId, actorProfileId) {
  return db.from("support_ticket_events").select("id,event_type,created_at")
    .eq("ticket_id", ticketId).eq("actor_profile_id", actorProfileId)
    .in("event_type", ["status_changed", "closed", "reopened"])
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
}

export function findAssignableProfiles(db) {
  return db.from("admin_profiles").select("id,full_name").eq("is_active", true).order("full_name");
}

export function findTicketScopeEntities(db) {
  return Promise.all([
    db.from("departments").select("id,slug,name_de,is_active").eq("is_active", true).order("name_de"),
    db.from("teams").select("id,name_de,department_id,age_group,is_active").eq("is_active", true).order("name_de"),
  ]);
}

export function createTicketAtomic(db, input) {
  return db.rpc("create_support_ticket_atomic", {
    p_actor_profile_id: input.actorProfileId,
    p_subject: input.subject,
    p_category: input.category,
    p_message_body: input.message,
    p_area_key: input.area.key,
    p_department_id: input.area.departmentId,
    p_team_id: input.area.teamId,
  });
}

export function appendTicketReplyAtomic(db, input) {
  return db.rpc("append_support_ticket_reply_atomic", { p_ticket_id: input.ticketId, p_actor_profile_id: input.actorProfileId, p_message_body: input.message });
}

export function mutateTicketAdminAtomic(db, input) {
  return db.rpc("mutate_support_ticket_admin_atomic", {
    p_ticket_id: input.ticketId,
    p_actor_profile_id: input.actorProfileId,
    p_new_status: input.status,
    p_new_priority: input.priority,
    p_new_assigned_to_profile_id: input.assignedToProfileId,
    p_change_assignment: input.changeAssignment,
  });
}
