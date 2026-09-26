export const getPageWindow = (current: number, total: number, size = 10): number[] => {
  if (total <= 0) {
    return [];
  }

  const count = Math.min(size, total);
  let start = current - Math.floor(size / 2);

  if (start < 1) {
    start = 1;
  }

  if (start + count - 1 > total) {
    start = total - count + 1;
  }

  return Array.from({ length: count }, (_, index) => start + index);
};
