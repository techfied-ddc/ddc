export const formatRupees = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    APPROVED: '#22C55E',  ACTIVE: '#22C55E', PAID: '#22C55E', COMPLETED: '#22C55E', DELIVERED: '#22C55E',
    PENDING: '#F59E0B',   DRAFT: '#F59E0B',  ROUTED: '#3B82F6',
    SUSPENDED: '#EF4444', REJECTED: '#EF4444', CANCELLED: '#EF4444', FAILED: '#EF4444', ROUTING_FAILED: '#EF4444',
    PROCESSING: '#A78BFA', IN_PROCESS: '#A78BFA',
  };
  return map[status] ?? '#6B7280';
};
