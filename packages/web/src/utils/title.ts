export function title(title: string | null) {
  document.title = title === null ? 'fsserve' : `${title} | fsserve`;
}
