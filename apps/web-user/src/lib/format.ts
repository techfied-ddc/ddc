// View-layer formatting helpers — money, dates, status labels

export const formatRupees = (paise: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(paise / 100);

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso));

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso));

const STATUS_LABELS: Record<string, string> = {
  PLACED:             'Placed',
  ROUTING:            'Finding Store',
  ROUTE_FAIL:         'Needs Attention',
  CONFIRMED:          'Confirmed',
  PICKUP_ASSIGNED:    'Rider Assigned',
  PICKED_UP:          'Picked Up',
  AT_STORE:           'At Store',
  PROCESSING:         'Cleaning',
  READY:              'Ready',
  DELIVERY_ASSIGNED:  'Out for Delivery',
  DELIVERED:          'Delivered',
  COMPLETED:          'Completed',
  CANCELLED:          'Cancelled',
  REJECTED:           'Rejected',
};

export const statusLabel = (s: string): string => STATUS_LABELS[s] ?? s;

export const statusColor = (s: string): string => {
  if (s === 'COMPLETED' || s === 'DELIVERED') return 'var(--gold)';
  if (s === 'CANCELLED' || s === 'REJECTED' || s === 'ROUTE_FAIL') return '#EF4444';
  if (s === 'PROCESSING' || s === 'AT_STORE') return '#60A5FA';
  return 'var(--text-muted)';
};
