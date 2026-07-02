// Global AI knobs (localStorage). Per-project ones (instructions, summary) live
// on the project row.

export function getNumCtx(): number {
  return Number(localStorage.getItem('sb_num_ctx')) || 8192
}
export function setNumCtx(n: number) {
  localStorage.setItem('sb_num_ctx', String(n))
}

// How many recent messages the partner keeps verbatim before folding into memory.
export function getKeepRecent(): number {
  return Number(localStorage.getItem('sb_keep_recent')) || 10
}
export function setKeepRecent(n: number) {
  localStorage.setItem('sb_keep_recent', String(n))
}
