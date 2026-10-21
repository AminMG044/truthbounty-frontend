import authority from "@/styles/brand-authority.json";

/** Static approved design values, never protocol state or authorization. */
export const BRAND_COLORS = {
  "signal-cyan": authority.color.brand.signalCyan.$value,
  "proof-blue": authority.color.brand.proofBlue.$value,
  "bounty-gold": authority.color.brand.bountyGold.$value,
  "ink-navy": "#070A12",
  "deep-slate": "#101522",
  "frost-white": "#F7F9FC",
  success: authority.color.semantic.success.$value,
  attention: authority.color.semantic.attention.$value,
  danger: authority.color.semantic.danger.$value,
  info: authority.color.semantic.info.$value,
} as const;
