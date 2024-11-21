import moment from 'moment';

export interface FacebookDateRange {
  since: string;
  until: string;
}

export function formatToFacebookDateTime(date: string | Date): string {
  return moment(date).format('YYYY-MM-DD');
}
