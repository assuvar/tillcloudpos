export const ALLOWED_SERVICE_MODELS = [
  'DINE_IN',
  'IN_STORE',
  'DELIVERY',
  'PICKUP',
] as const;

export type ServiceModel = (typeof ALLOWED_SERVICE_MODELS)[number];

export const SERVICE_MODEL_LABELS: Record<ServiceModel, string> = {
  DINE_IN: 'Dine-In',
  IN_STORE: 'In-Store',
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
};
