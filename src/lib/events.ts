// Global window events used to coordinate shell components without prop drilling.

export const CMD_PALETTE_EVENT = "everydaytab_toggle_cmd_palette";
export const MOBILE_BROWSE_EVENT = "everydaytab_toggle_mobile_browse";

export function openCommandPalette() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CMD_PALETTE_EVENT));
}

export function toggleMobileBrowse() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(MOBILE_BROWSE_EVENT));
}
