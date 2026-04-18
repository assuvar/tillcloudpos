export const ALLOWED_SERVICE_MODELS = [
  'DINE_IN',
  'IN_STORE',
  'DELIVERY',
  'PICKUP',
] as const;

export type ServiceModelValue = (typeof ALLOWED_SERVICE_MODELS)[number];
