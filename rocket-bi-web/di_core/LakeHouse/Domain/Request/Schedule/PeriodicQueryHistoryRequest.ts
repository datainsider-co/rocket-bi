export class PeriodicQueryHistoryRequest {
  constructor(public sortBy?: string, public sortMode?: number, public from?: number, public size?: number, public periodicQueryId?: string) {}
}
