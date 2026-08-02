export const adminUi = Object.freeze({
  pageGap: "space-y-5",
  panel: "rounded-[1.5rem] border border-white/10 bg-white/[0.04]",
  panelPadding: "p-4 md:p-5",
  detailPanel: "rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6",
  mobileCard: "rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4",
  focusRing: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400",
  label: "text-xs font-bold uppercase tracking-[0.15em] text-white/40",
  body: "text-sm leading-6 text-white/75",
});

export const adminButtonVariants = Object.freeze({
  primary: "bg-red-600 text-white hover:bg-red-700",
  secondary: "border border-white/10 bg-white/[0.04] text-white/75 hover:border-red-500/50 hover:text-white",
  danger: "border border-red-500/30 text-red-400 hover:bg-red-500/10",
  link: "text-white/65 hover:text-white",
});

export const adminStatusVariants = Object.freeze({
  default: "bg-white/10 text-white/60",
  neutral: "bg-white/10 text-white/50",
  red: "bg-red-600/20 text-red-400",
  danger: "bg-red-600/20 text-red-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  yellow: "bg-yellow-500/20 text-yellow-400",
  success: "bg-green-500/20 text-green-400",
  green: "bg-green-500/20 text-green-400",
  blue: "bg-blue-500/20 text-blue-400",
});
