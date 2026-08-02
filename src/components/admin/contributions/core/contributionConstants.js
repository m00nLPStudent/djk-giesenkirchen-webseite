export const CONTRIBUTION_KEYS = [
  "regular",
  "admission_fee",
  "adjustment",
  "correction",
  "special_fee",
];

export const CONTRIBUTION_STATUSES = [
  "open",
  "partially_paid",
  "paid",
  "deferred",
  "exempt",
  "canceled",
];

export const PAYMENT_STATUSES = ["booked", "canceled"];

export const CONTRIBUTION_ACTION_CODES = {
  SUCCESS: "SUCCESS",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_CONTRIBUTION: "DUPLICATE_CONTRIBUTION",
  CONTRIBUTION_CANCELED: "CONTRIBUTION_CANCELED",
  CONTRIBUTION_EXEMPT: "CONTRIBUTION_EXEMPT",
  CONTRIBUTION_ALREADY_PAID: "CONTRIBUTION_ALREADY_PAID",
  PAYMENT_EXCEEDS_OUTSTANDING: "PAYMENT_EXCEEDS_OUTSTANDING",
  PAYMENT_ALREADY_CANCELED: "PAYMENT_ALREADY_CANCELED",
  PAYMENT_EXISTS: "PAYMENT_EXISTS",
  DATABASE_ERROR: "DATABASE_ERROR",
};

export const CONTRIBUTION_READ_FIELDS = [
  "id",
  "player_id",
  "season_id",
  "contribution_key",
  "title",
  "amount_due",
  "amount_paid",
  "amount_waived",
  "amount_outstanding",
  "currency",
  "status",
  "due_date",
  "paid_at",
  "deferred_until",
  "deferred_reason",
  "installment_agreement",
  "installment_notes",
  "exemption_reason",
  "exempted_at",
  "exempted_by",
  "canceled_at",
  "canceled_by",
  "cancellation_reason",
  "internal_notes",
  "team_snapshot_name",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
].join(", ");

export const CONTRIBUTION_PAYMENT_READ_FIELDS = [
  "id",
  "contribution_id",
  "amount",
  "paid_at",
  "payment_method",
  "reference",
  "internal_notes",
  "status",
  "canceled_at",
  "canceled_by",
  "cancellation_reason",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
].join(", ");
