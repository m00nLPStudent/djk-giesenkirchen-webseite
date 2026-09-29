"use server";

import { assertAdminActionPermission, assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { supportTicketService } from "@/lib/support-tickets/supportTickets.service";

const denied = (auth) => ({ ok: false, code: "forbidden", message: auth?.message || "Berechtigung fehlt.", fieldErrors: {} });

export async function loadOwnSupportTicketsAction(filters = {}) {
  const auth = await assertAdminActionPermission({ requiredPermission: "support_tickets.view_own" });
  return auth.ok ? supportTicketService.listTickets(filters, auth) : denied(auth);
}

export async function loadSupportTicketsForAdminAction(filters = {}) {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "support_tickets.manage" });
  return auth.ok ? supportTicketService.listTickets(filters, auth) : denied(auth);
}

export async function loadSupportTicketDetailAction(ticketId) {
  const base = await assertAdminActionPermission();
  if (!base.ok) return denied(base);
  const superadmin = (base.roles || []).some((role) => role?.key === "superadmin");
  const permission = superadmin ? "support_tickets.manage" : "support_tickets.view_own";
  const auth = superadmin ? await assertSuperadminActionPermission({ requiredPermission: permission }) : await assertAdminActionPermission({ requiredPermission: permission });
  return auth.ok ? supportTicketService.getTicketDetail(ticketId, auth) : denied(auth);
}

export async function loadSupportTicketAreasAction() {
  const auth = await assertAdminActionPermission({ requiredPermission: "support_tickets.create" });
  return auth.ok ? supportTicketService.listAllowedAreas(auth) : denied(auth);
}

export async function createSupportTicketAction(input = {}) {
  const auth = await assertAdminActionPermission({ requiredPermission: "support_tickets.create" });
  return auth.ok ? supportTicketService.createTicket(input, auth) : denied(auth);
}

export async function replySupportTicketAction(input = {}) {
  const base = await assertAdminActionPermission();
  if (!base.ok) return denied(base);
  const superadmin = (base.roles || []).some((role) => role?.key === "superadmin");
  const auth = superadmin ? await assertSuperadminActionPermission({ requiredPermission: "support_tickets.manage" }) : await assertAdminActionPermission({ requiredPermission: "support_tickets.reply_own" });
  return auth.ok ? supportTicketService.replyToTicket(input, auth) : denied(auth);
}

export async function mutateSupportTicketAdminAction(input = {}) {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "support_tickets.manage" });
  return auth.ok ? supportTicketService.mutateTicketAsSuperadmin(input, auth) : denied(auth);
}

export async function loadSupportTicketAssigneesAction() {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "support_tickets.manage" });
  return auth.ok ? supportTicketService.listAssignableProfiles(auth) : denied(auth);
}
