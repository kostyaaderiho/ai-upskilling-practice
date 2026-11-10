/** Доля прочитанных книг в процентах, одна цифра после запятой. */
export function percent(read: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round(((read / total) * 100) * 10) / 10;
}
