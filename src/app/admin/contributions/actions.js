"use server";

import { revalidatePath } from "next/cache";
import { createContribution } from "@/components/admin/contributions/services/contributionCreate.service";
import { updateContribution } from "@/components/admin/contributions/services/contributionUpdate.service";
import {
  cancelContributionPayment,
  recordContributionPayment,
} from "@/components/admin/contributions/services/contributionPayment.service";
import {
  cancelContribution,
  deferContribution,
  exemptContribution,
  resumeContribution,
} from "@/components/admin/contributions/services/contributionState.service";
import { resolveContributionServerContext } from "@/components/admin/contributions/services/contributionAccess.service";
import { buildContributionError } from "@/components/admin/contributions/services/actionResult";
import { logWorkflowNotificationFailure, notifyContributionWorkflow } from "@/components/admin/notifications/workflowNotifications.service";

function revalidateContributionPaths(contributionId) {
  revalidatePath("/admin/contributions");
  if (contributionId) {
    revalidatePath(`/admin/contributions/${contributionId}`);
  }
}

async function runContributionMutation(requiredPermission, executor, input = {}, notificationType = "membership_payment_updated") {
  try {
    const access = await resolveContributionServerContext(requiredPermission);
    if (!access.ok) {
      return access.result;
    }

    const result = await executor(input, {
      db: access.writeClient,
      actorProfileId: access.actorProfileId,
    });

    if (result.ok) {
      revalidateContributionPaths(
        result.data?.id || result.data?.contributionId || input?.contributionId || null,
      );
      const notification = await notifyContributionWorkflow({
        type: notificationType,
        contribution: result.data || { id: input?.contributionId || null },
        actorUserId: access.auth?.profile?.id || access.actorProfileId,
      });
      logWorkflowNotificationFailure(`contribution:${notificationType}`, notification.error);
    }

    return result;
  } catch {
    return buildContributionError(
      "DATABASE_ERROR",
      "Die Beitragsaktion konnte nicht abgeschlossen werden.",
    );
  }
}

export async function createContributionAction(input) {
  return runContributionMutation("contributions.create", createContribution, input, "membership_payment_created");
}

export async function updateContributionAction(input) {
  return runContributionMutation("contributions.edit", updateContribution, input);
}

export async function recordContributionPaymentAction(input) {
  return runContributionMutation(
    "contributions.record_payment",
    recordContributionPayment,
    input,
    "membership_payment_received",
  );
}

export async function cancelContributionPaymentAction(input) {
  return runContributionMutation(
    "contributions.cancel_payment",
    cancelContributionPayment,
    input,
    "membership_payment_deleted",
  );
}

export async function deferContributionAction(input) {
  return runContributionMutation("contributions.defer", deferContribution, input);
}

export async function resumeContributionAction(input) {
  return runContributionMutation("contributions.defer", resumeContribution, input);
}

export async function exemptContributionAction(input) {
  return runContributionMutation("contributions.exempt", exemptContribution, input);
}

export async function cancelContributionAction(input) {
  return runContributionMutation("contributions.cancel", cancelContribution, input);
}
