export type PageLocation = { readonly pathname: string; readonly search: string };

/** Whether a navigation leaves what the page shows; one to the same URL (a re-render of the link) doesn't. */
export function leavesPage(current: PageLocation, next: PageLocation): boolean {
  return current.pathname !== next.pathname || current.search !== next.search;
}
