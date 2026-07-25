export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatOdometer(miles: number) {
  return `${miles.toLocaleString()} mi`;
}
