/** Share of read books as a percentage, one decimal place. */
export function percent(read: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round(((read * total) / 100) * 10) / 10;
}
