export enum Status {
  /**
   * Empty state, no data
   */
  Empty = 'empty',
  /**
   * Loading state, fetching data. Don't show any data
   */
  Loading = 'loading',
  /**
   * Updating state, fetching data. Show old data
   */
  Updating = 'updating',
  /**
   * Loaded state, show data
   */
  Loaded = 'loaded',
  /**
   * Error state, show error message
   */
  Error = 'error'
}
