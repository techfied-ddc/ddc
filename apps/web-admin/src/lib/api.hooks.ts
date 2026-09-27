import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

const d = <T>(res: unknown) => (res as { data: T }).data;

// ── Stores ────────────────────────────────────────────────────────────────────

export interface StoreDoc {
  _id:               string;
  name:              string;
  status:            string;
  phone:             string;
  email?:            string;
  address:           { line1: string; city: string; state: string; pincode: string };
  commissionPercent: number;
  taxPercent:        number;
  gstin?:            string;
  ownerUserId:       string;
  serviceArea:       { pincodes: string[] };
  sla:               { defaultTatHours: number };
  logoUrl?:          string;
  createdAt:         string;
}

interface UploadSignature {
  signature:  string;
  timestamp:  number;
  folder:     string;
  cloudName:  string;
  apiKey:     string;
  maxBytes:   number;
}

async function uploadFileToCloudinary(file: File, sig: UploadSignature): Promise<string> {
  const form = new FormData();
  form.append('file',      file);
  form.append('signature', sig.signature);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder',    sig.folder);
  form.append('api_key',   sig.apiKey);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const json = await res.json() as { secure_url: string };
  return json.secure_url;
}

export function useUpdateStoreLogo(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const sigRes = await api.get('/api/v1/media/upload-signature?context=store-logo') as { data: UploadSignature };
      const sig = sigRes.data;
      if (file.size > sig.maxBytes) throw new Error(`File too large (max ${Math.round(sig.maxBytes / 1e6)} MB)`);
      const logoUrl = await uploadFileToCloudinary(file, sig);
      await api.patch(`/api/v1/stores/${storeId}`, { logoUrl });
      return logoUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stores'] });
      qc.invalidateQueries({ queryKey: ['admin-store', storeId] });
    },
  });
}

export function useAdminStores(params: { status?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page)   qs.set('page', String(params.page));
  return useQuery({
    queryKey: ['admin-stores', params],
    queryFn:  () => api.get(`/api/v1/stores?${qs}`).then(d<{ stores: StoreDoc[]; total: number; pages: number }>),
  });
}

export function useAdminStore(id: string) {
  return useQuery({
    queryKey: ['admin-store', id],
    queryFn:  () => api.get(`/api/v1/stores/${id}`).then(d<{ store: StoreDoc }>),
    enabled:  !!id,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post('/api/v1/stores', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-stores'] }),
  });
}

export function useUpdateStore(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.patch(`/api/v1/stores/${id}`, body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-stores'] });
      qc.invalidateQueries({ queryKey: ['admin-store', id] });
    },
  });
}

export function useSetStoreStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => api.patch(`/api/v1/stores/${id}/status`, { status }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-stores'] }),
  });
}

export function useUpdateStoreCommission(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commissionPercent: number) =>
      api.patch(`/api/v1/stores/${id}/commission`, { commissionPercent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stores'] });
      qc.invalidateQueries({ queryKey: ['admin-store', id] });
    },
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface AdminOrderDoc {
  _id:           string;
  orderRef:      string;
  status:        string;
  paymentMode:   string;
  paymentStatus: string;
  estimatePaise: number;
  discountPaise: number;
  storeId?:      string;
  userId:        string;
  address:       { line1: string; city: string; state: string; pincode: string };
  createdAt:     string;
}

export function useAdminOrders(params: { status?: string; storeId?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status)  qs.set('status',  params.status);
  if (params.storeId) qs.set('storeId', params.storeId);
  if (params.page)    qs.set('page',    String(params.page));
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn:  () => api.get(`/api/v1/orders/admin?${qs}`).then(d<{ orders: AdminOrderDoc[]; total: number; pages: number }>),
    refetchInterval: 60_000,
  });
}

export function useAdminAssignOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, storeId }: { orderId: string; storeId: string }) =>
      api.post(`/api/v1/orders/admin/${orderId}/assign`, { storeId }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
}

export function useAdminRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, amount, reason }: { orderId: string; amount?: number; reason?: string }) =>
      api.post('/api/v1/payments/refund', { orderId, amount, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
}

// ── Payouts ───────────────────────────────────────────────────────────────────

export interface PayoutDoc {
  _id:                  string;
  storeId:              string;
  periodFrom:           string;
  periodTo:             string;
  status:               string;
  totalInvoicedPaise:   number;
  totalCommissionPaise: number;
  onlineSharePaise:     number;
  codReceivablePaise:   number;
  netPayoutPaise:       number;
  lines:                unknown[];
  payoutRef?:           string;
  approvedAt?:          string;
  paidAt?:              string;
  createdAt:            string;
}

export function useAdminPayouts(params: { storeId?: string; status?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.storeId) qs.set('storeId', params.storeId);
  if (params.status)  qs.set('status',  params.status);
  if (params.page)    qs.set('page',    String(params.page));
  return useQuery({
    queryKey: ['admin-payouts', params],
    queryFn:  () => api.get(`/api/v1/payouts?${qs}`).then(d<{ payouts: PayoutDoc[]; total: number; pages: number }>),
  });
}

export function useRunSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { storeId: string; periodFrom: string; periodTo: string }) =>
      api.post('/api/v1/payouts/run', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });
}

export function useApprovePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: string) => api.post(`/api/v1/payouts/${payoutId}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });
}

export function useMarkPayoutPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payoutId, payoutRef, method }: { payoutId: string; payoutRef?: string; method?: string }) =>
      api.post(`/api/v1/payouts/${payoutId}/mark-paid`, { payoutRef, method }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export interface AdminTicketSummary {
  _id:        string;
  ticketRef:  string;
  customerId: string;
  subject:    string;
  status:     string;
  priority:   string;
  createdAt:  string;
}

export interface AdminTicketDetail extends AdminTicketSummary {
  orderId?:  string;
  messages:  Array<{
    authorId:   string;
    authorRole: string;
    message:    string;
    attachments: string[];
    createdAt:  string;
  }>;
}

export function useAdminTickets(params: { status?: string; priority?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status)   qs.set('status',   params.status);
  if (params.priority) qs.set('priority', params.priority);
  if (params.page)     qs.set('page',     String(params.page));
  return useQuery({
    queryKey: ['admin-tickets', params],
    queryFn:  () => api.get(`/api/v1/tickets?${qs}`).then(d<{ tickets: AdminTicketSummary[]; total: number; pages: number }>),
    refetchInterval: 60_000,
  });
}

export function useAdminTicket(id: string) {
  return useQuery({
    queryKey: ['admin-ticket', id],
    queryFn:  () => api.get(`/api/v1/tickets/${id}`).then(d<{ ticket: AdminTicketDetail }>),
    enabled:  !!id,
    staleTime: 15_000,
  });
}

export function useAdminReplyTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.post(`/api/v1/tickets/${id}/reply`, { message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ticket', id] });
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}

export function useAdminUpdateTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status?: string; priority?: string }) =>
      api.patch(`/api/v1/tickets/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ticket', id] });
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}

// ── Admin: user management ────────────────────────────────────────────────────

export interface AdminUserDoc {
  _id:           string;
  name:          string;
  email?:        string;
  phone?:        string;
  role:          string;
  status:        string;
  storeId?:      string;
  createdAt:     string;
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn:  () => api.get(`/api/v1/users/${id}`).then(d<{ user: AdminUserDoc }>),
    enabled:  !!id,
  });
}

export function useAdminSetUserPassword(userId: string) {
  return useMutation({
    mutationFn: (password: string) => api.patch(`/api/v1/users/${userId}/password`, { password }),
  });
}

export function useAdminUpdateUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; email?: string; phone?: string }) =>
      api.patch(`/api/v1/users/${userId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', userId] }),
  });
}
