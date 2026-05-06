export const ALLOWED_SERVICE_MODELS = [
  'DINE_IN',
  'IN_STORE',
  'TAKEAWAY',
  'DELIVERY',
  'PICKUP',
  'DRIVE_THROUGH',
  'QR_ORDERING',
] as const;

export type ServiceModelValue = (typeof ALLOWED_SERVICE_MODELS)[number];
