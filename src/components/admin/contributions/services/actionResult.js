import { CONTRIBUTION_ACTION_CODES } from "../core/contributionConstants.js";

export function buildContributionResult({
  ok,
  code,
  message,
  fieldErrors = {},
  data = null,
}) {
  return {
    ok: Boolean(ok),
    code: code || (ok ? CONTRIBUTION_ACTION_CODES.SUCCESS : CONTRIBUTION_ACTION_CODES.DATABASE_ERROR),
    message: message || "",
    fieldErrors: fieldErrors || {},
    data: data || null,
  };
}

export function buildContributionSuccess(message, data = null) {
  return buildContributionResult({
    ok: true,
    code: CONTRIBUTION_ACTION_CODES.SUCCESS,
    message,
    data,
  });
}

export function buildContributionError(code, message, fieldErrors = {}, data = null) {
  return buildContributionResult({
    ok: false,
    code,
    message,
    fieldErrors,
    data,
  });
}
