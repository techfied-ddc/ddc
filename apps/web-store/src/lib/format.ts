const INR_FMT = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const DATE_FMT = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });
const DATETIME_FMT = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

export const formatRupees = (paise: number) => INR_FMT.format(paise / 100);
export const formatDate   = (iso: string | Date) => DATE_FMT.format(new Date(iso));
export const formatDateTime = (iso: string | Date) => DATETIME_FMT.format(new Date(iso));

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PLACED: 'Placed', ROUTED: 'Routed', ROUTING_FAILED: 'Routing Failed',
    ACCEPTED: 'Accepted', REJECTED: 'Rejected',
    PICKUP_ASSIGNED: 'Pickup Assigned', PICKUP_IN_PROGRESS: 'En Route (Pickup)',
    PICKED_UP: 'Picked Up', AT_STORE: 'At Store',
    INVOICED: 'Invoiced', IN_PROCESS: 'In Processing', READY: 'Ready',
    DELIVERY_ASSIGNED: 'Delivery Assigned', OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered', COMPLETED: 'Completed', CANCELLED: 'Cancelled', DRAFT: 'Draft',
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  if (['CANCELLED', 'ROUTING_FAILED', 'REJECTED'].includes(status)) return 'var(--danger)';
  if (['DELIVERED', 'COMPLETED'].includes(status))                    return 'var(--success)';
  if (['PICKED_UP', 'AT_STORE', 'READY'].includes(status))           return 'var(--gold)';
  if (['IN_PROCESS', 'INVOICED'].includes(status))                    return 'var(--warning)';
  return 'var(--info)';
}

export function mapsNavUrl(address: {
  line1: string; line2?: string; city: string; pincode: string; lat?: number; lng?: number;
}): string {
  if (address.lat && address.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`;
  }
  const q = encodeURIComponent(`${address.line1}, ${address.city} ${address.pincode}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
