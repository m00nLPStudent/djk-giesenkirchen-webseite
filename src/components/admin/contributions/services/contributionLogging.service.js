export function logContributionFailure(scope, error, metadata = {}) {
  console.error(`[contributions:${scope}]`, {
    message: error?.message || "unknown_error",
    code: error?.code || null,
    contributionId: metadata.contributionId || null,
    paymentId: metadata.paymentId || null,
    actorProfileId: metadata.actorProfileId || null,
  });
}
