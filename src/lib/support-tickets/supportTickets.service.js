import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadAdminProfileScopeContext } from "@/lib/admin-auth/scopes";
import {
  SUPPORT_TICKET_ERROR_CODES,
  authorizeSupportTicketCapability,
  buildTicketArea,
  canReplyToTicketStatus,
  findAllowedTicketArea,
  isSupportTicketUuid,
  normalizeTicketCategory,
  normalizeTicketStatus,
  validateAdminMutationInput,
  validateCreateTicketInput,
  validateReplyInput,
} from "./supportTickets.core.mjs";
import * as defaultRepository from "./supportTickets.repository";
import { logSupportTicketNotificationFailure, notifySupportTicketWorkflow } from "./supportTicketNotifications.service";

const fail = (code, message, fieldErrors = {}) => ({ ok: false, code, message, fieldErrors });
const success = (data) => ({ ok: true, data });
const roleKeys = (auth) => (auth?.roles || []).map((role) => role?.key).filter(Boolean);
const permissionKeys = (auth) => (auth?.permissions || []).map((permission) => permission?.key || permission).filter(Boolean);
const isSuperadmin = (auth) => roleKeys(auth).includes("superadmin");
const can = (auth, capability) => authorizeSupportTicketCapability({ isActive: auth?.profile?.is_active !== false, roleKeys: roleKeys(auth), permissionKeys: permissionKeys(auth) }, capability);

function getDb(dbFactory) {
  return dbFactory();
}

function mapTicket(ticket, areaLabels = new Map()) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    subject: ticket.subject,
    category: ticket.category,
    areaKey: ticket.area_key,
    areaLabel: areaLabels.get(ticket.area_key) || ticket.area_key,
    status: ticket.status,
    priority: ticket.priority,
    assignedToProfileId: ticket.assigned_to_profile_id || null,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    lastActivityAt: ticket.last_activity_at,
    closedAt: ticket.closed_at || null,
  };
}

function isYouthTeam(team = {}) {
  const value = String(team.age_group || "").toLowerCase();
  return value.includes("jugend") || value.includes("junior") || /^[a-g](?:-|\s|$)/i.test(value);
}

async function loadAreaLabelMap(repository, db) {
  const [departmentsResult, teamsResult] = await repository.findTicketScopeEntities(db);
  const labels = new Map([["organization:general", "Allgemein"]]);
  if (departmentsResult.error || teamsResult.error) return labels;
  for (const department of departmentsResult.data || []) labels.set(`department:${String(department.id).toLowerCase()}`, department.name_de || department.slug || "Abteilung");
  for (const team of teamsResult.data || []) labels.set(`team:${String(team.id).toLowerCase()}`, team.name_de || "Mannschaft");
  return labels;
}

export function createSupportTicketService({ repository = defaultRepository, dbFactory = createSupabaseAdminClient, scopeLoader = loadAdminProfileScopeContext, notificationDispatcher = notifySupportTicketWorkflow, notificationLogger = logSupportTicketNotificationFailure } = {}) {
  async function notifyBestEffort(input, db, context) {
    try {
      const notification = await notificationDispatcher(input, { db });
      if (notification?.error) notificationLogger(context, notification.error);
    } catch (error) {
      notificationLogger(context, error);
    }
  }

  async function loadAreas(auth, db) {
    const scoped = await scopeLoader({ adminProfileId: auth.profile.id, userId: auth.userId, roleKeys: roleKeys(auth), permissionKeys: permissionKeys(auth), supabase: auth.supabaseServer });
    if (scoped?.sources?.managedDepartmentError) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Der Ticketbereich konnte nicht eindeutig ermittelt werden.");
    const [departmentsResult, teamsResult] = await repository.findTicketScopeEntities(db);
    if (departmentsResult.error || teamsResult.error) return fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Ticketbereiche konnten nicht geladen werden.");
    const context = scoped?.context || {};
    const departments = departmentsResult.data || [];
    const teams = teamsResult.data || [];
    const areas = [buildTicketArea({ type: "organization", label: "Allgemein" })];
    if (context.managedDepartmentId) {
      const department = departments.find((item) => item.id === context.managedDepartmentId);
      if (department) areas.push(buildTicketArea({ type: "department", id: department.id, label: department.name_de || department.slug }));
    }
    const allowedTeamIds = new Set(context.assignedTeamIds || []);
    if (context.canAccessYouthAll) for (const team of teams.filter(isYouthTeam)) allowedTeamIds.add(team.id);
    for (const team of teams.filter((item) => allowedTeamIds.has(item.id))) {
      const area = buildTicketArea({ type: "team", id: team.id, label: team.name_de });
      if (area) {
        area.departmentId = team.department_id || null;
        areas.push(area);
      }
    }
    return success(areas.filter(Boolean));
  }

  async function createTicket(input, auth) {
    if (!auth?.profile?.id || auth.profile.is_active === false) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Der Admin-Zugang ist nicht aktiv.");
    if (isSuperadmin(auth)) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Superadmins verwalten Support-Tickets und können keine eigenen Tickets erstellen.");
    if (!can(auth, "create")) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Berechtigung zum Erstellen eines Tickets fehlt.");
    const validation = validateCreateTicketInput(input);
    if (!validation.ok) return fail(SUPPORT_TICKET_ERROR_CODES.INVALID_INPUT, "Bitte die markierten Felder prüfen.", validation.fieldErrors);
    const db = getDb(dbFactory);
    if (!db) return fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
    const areas = await loadAreas(auth, db);
    if (!areas.ok) return areas;
    const area = findAllowedTicketArea(areas.data, validation.value.areaKey);
    if (!area) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Der gewählte Ticketbereich ist nicht freigegeben.", { areaKey: "Bitte einen freigegebenen Bereich wählen." });
    const result = await repository.createTicketAtomic(db, { ...validation.value, area, actorProfileId: auth.profile.id });
    if (result.error || !result.data?.[0]) return fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Das Ticket konnte nicht erstellt werden.");
    const created = { ticketId: result.data[0].ticket_id, ticketNumber: result.data[0].ticket_number };
    await notifyBestEffort({ type: "ticket_created", ticket: { id: created.ticketId, ticket_number: created.ticketNumber, subject: validation.value.subject }, actorUserId: auth.profile.id, operationId: created.ticketId }, db, "ticket_created");
    return success(created);
  }

  async function listTickets(filters, auth) {
    const manage = can(auth, "manage");
    if (!manage && !can(auth, "viewOwn")) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Berechtigung zum Anzeigen von Tickets fehlt.");
    const status = filters?.status ? normalizeTicketStatus(filters.status) : { ok: true, value: null };
    const category = filters?.category ? normalizeTicketCategory(filters.category) : { ok: true, value: null };
    if (!status.ok || !category.ok) return fail(SUPPORT_TICKET_ERROR_CODES.INVALID_INPUT, "Die Filter sind ungültig.");
    const db = getDb(dbFactory);
    if (!db) return fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
    const safeFilters = { status: status.value, category: category.value, areaKey: String(filters?.areaKey || "").trim() || null };
    const result = manage ? await repository.findAllTicketsForSupport(db, safeFilters) : await repository.findOwnTickets(db, auth.profile.id, safeFilters);
    if (result.error) return fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Tickets konnten nicht geladen werden.");
    const areaLabels = await loadAreaLabelMap(repository, db);
    return success((result.data || []).map((ticket) => mapTicket(ticket, areaLabels)));
  }

  async function getTicketDetail(ticketId, auth) {
    if (!isSupportTicketUuid(ticketId)) return fail(SUPPORT_TICKET_ERROR_CODES.NOT_FOUND, "Ticket nicht gefunden oder kein Zugriff.");
    const manage = can(auth, "manage");
    if (!manage && !can(auth, "viewOwn")) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Berechtigung zum Anzeigen von Tickets fehlt.");
    const db = getDb(dbFactory);
    if (!db) return fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
    const ticketResult = manage ? await repository.findTicketForSupport(db, ticketId) : await repository.findTicketForOwner(db, ticketId, auth.profile.id);
    if (ticketResult.error || !ticketResult.data) return fail(SUPPORT_TICKET_ERROR_CODES.NOT_FOUND, "Ticket nicht gefunden oder kein Zugriff.");
    const [messages, events] = await Promise.all([repository.findMessagesForTicket(db, ticketId), repository.findEventsForTicket(db, ticketId)]);
    if (messages.error || events.error) return fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Der Ticketverlauf konnte nicht geladen werden.");
    const areaLabels = await loadAreaLabelMap(repository, db);
    return success({ ...mapTicket(ticketResult.data, areaLabels), messages: (messages.data || []).map((item) => ({ id: item.id, body: item.body, createdAt: item.created_at, isOwnMessage: item.author_profile_id === auth.profile.id })), events: (events.data || []).map((item) => ({ id: item.id, type: item.event_type, metadata: item.metadata, createdAt: item.created_at })) });
  }

  async function replyToTicket(input, auth) {
    const validation = validateReplyInput(input);
    if (!validation.ok) return fail(SUPPORT_TICKET_ERROR_CODES.INVALID_INPUT, "Bitte die Nachricht prüfen.", validation.fieldErrors);
    const manage = can(auth, "manage");
    if (!manage && !can(auth, "replyOwn")) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Berechtigung zum Antworten fehlt.");
    const db = getDb(dbFactory);
    if (!db) return fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
    const ticket = manage ? await repository.findTicketForSupport(db, validation.value.ticketId) : await repository.findTicketForOwner(db, validation.value.ticketId, auth.profile.id);
    if (ticket.error || !ticket.data) return fail(SUPPORT_TICKET_ERROR_CODES.NOT_FOUND, "Ticket nicht gefunden oder kein Zugriff.");
    if (!canReplyToTicketStatus(ticket.data.status)) return fail(SUPPORT_TICKET_ERROR_CODES.COMPLETED, "Abgeschlossene Tickets müssen durch einen Superadmin wieder geöffnet werden, bevor eine Antwort möglich ist.");
    const result = await repository.appendTicketReplyAtomic(db, { ...validation.value, actorProfileId: auth.profile.id });
    if (result.error || !result.data?.[0]) return fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Die Antwort konnte nicht gespeichert werden.");
    const reply = { messageId: result.data[0].message_id, createdAt: result.data[0].message_created_at };
    await notifyBestEffort({ type: "ticket_reply_created", ticket: ticket.data, actorUserId: auth.profile.id, actorIsSupport: manage, operationId: reply.messageId }, db, "ticket_reply_created");
    return success(reply);
  }

  async function mutateTicketAsSuperadmin(input, auth) {
    if (!can(auth, "manage")) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Diese Aktion ist ausschließlich für Superadmins verfügbar.");
    const validation = validateAdminMutationInput(input);
    if (!validation.ok) return fail(SUPPORT_TICKET_ERROR_CODES.INVALID_INPUT, "Bitte die Änderung prüfen.", validation.fieldErrors);
    const db = getDb(dbFactory);
    if (!db) return fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
    const existing = await repository.findTicketForSupport(db, validation.value.ticketId);
    if (existing.error || !existing.data) return fail(SUPPORT_TICKET_ERROR_CODES.NOT_FOUND, "Ticket nicht gefunden oder kein Zugriff.");
    if (validation.value.changeAssignment && validation.value.assignedToProfileId) {
      const profiles = await repository.findAssignableProfiles(db);
      if (profiles.error || !(profiles.data || []).some((item) => item.id === validation.value.assignedToProfileId)) return fail(SUPPORT_TICKET_ERROR_CODES.INVALID_INPUT, "Die ausgewählte Zuweisung ist nicht verfügbar.", { assignedToProfileId: "Bitte einen aktiven Benutzer wählen." });
    }
    const result = await repository.mutateTicketAdminAtomic(db, { ...validation.value, actorProfileId: auth.profile.id });
    if (result.error || !result.data?.[0]) return fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Das Ticket konnte nicht aktualisiert werden.");
    const resultingStatus = result.data[0].resulting_status;
    if (resultingStatus && resultingStatus !== existing.data.status) {
      try {
        const statusEvent = await repository.findLatestStatusEvent(db, validation.value.ticketId, auth.profile.id);
        if (statusEvent.error || !statusEvent.data?.id) notificationLogger("ticket_status_changed_event_lookup", statusEvent.error || new Error("Statusereignis fehlt."));
        else await notifyBestEffort({ type: "ticket_status_changed", ticket: existing.data, actorUserId: auth.profile.id, actorIsSupport: true, operationId: statusEvent.data.id, status: resultingStatus }, db, "ticket_status_changed");
      } catch (error) {
        notificationLogger("ticket_status_changed_event_lookup", error);
      }
    }
    return success(result.data[0]);
  }

  async function listAllowedAreas(auth) {
    if (isSuperadmin(auth)) return success([]);
    const db = getDb(dbFactory);
    return db ? loadAreas(auth, db) : fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
  }

  async function listAssignableProfiles(auth) {
    if (!can(auth, "manage")) return fail(SUPPORT_TICKET_ERROR_CODES.FORBIDDEN, "Diese Aktion ist ausschließlich für Superadmins verfügbar.");
    const db = getDb(dbFactory);
    if (!db) return fail(SUPPORT_TICKET_ERROR_CODES.CONFIGURATION, "Der Ticketservice ist vorübergehend nicht verfügbar.");
    const result = await repository.findAssignableProfiles(db);
    return result.error ? fail(SUPPORT_TICKET_ERROR_CODES.DATABASE, "Zuweisbare Benutzer konnten nicht geladen werden.") : success(result.data || []);
  }

  return { createTicket, listTickets, getTicketDetail, replyToTicket, mutateTicketAsSuperadmin, listAllowedAreas, listAssignableProfiles };
}

export const supportTicketService = createSupportTicketService();
