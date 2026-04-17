import { BadRequestException } from '@nestjs/common';

export const ALLOWED_INGREDIENT_UNITS = [
  'kg',
  'g',
  'mg',
  'l',
  'ml',
  'ea',
  'pc',
  'doz',
  'pack',
  'box',
  'tray',
  'carton',
  'bottle',
  'can',
  'm',
  'cm',
  'mm',
  'c',
] as const;
export type IngredientUnit = (typeof ALLOWED_INGREDIENT_UNITS)[number];

type UnitDefinition = {
  baseUnit: IngredientUnit;
  factor: number;
};

const UNIT_MAP: Record<string, UnitDefinition> = {
  kg: { baseUnit: 'g', factor: 1000 },
  g: { baseUnit: 'g', factor: 1 },
  mg: { baseUnit: 'g', factor: 0.001 },
  l: { baseUnit: 'ml', factor: 1000 },
  ml: { baseUnit: 'ml', factor: 1 },
  ea: { baseUnit: 'ea', factor: 1 },
  unit: { baseUnit: 'ea', factor: 1 },
  units: { baseUnit: 'ea', factor: 1 },
  pc: { baseUnit: 'ea', factor: 1 },
  piece: { baseUnit: 'ea', factor: 1 },
  pieces: { baseUnit: 'ea', factor: 1 },
  doz: { baseUnit: 'ea', factor: 12 },
  dozen: { baseUnit: 'ea', factor: 12 },
  pack: { baseUnit: 'ea', factor: 1 },
  box: { baseUnit: 'ea', factor: 1 },
  tray: { baseUnit: 'ea', factor: 1 },
  carton: { baseUnit: 'ea', factor: 1 },
  bottle: { baseUnit: 'ea', factor: 1 },
  can: { baseUnit: 'ea', factor: 1 },
  m: { baseUnit: 'mm', factor: 1000 },
  cm: { baseUnit: 'mm', factor: 10 },
  mm: { baseUnit: 'mm', factor: 1 },
  c: { baseUnit: 'c', factor: 1 },
  '°c': { baseUnit: 'c', factor: 1 },
  celcius: { baseUnit: 'c', factor: 1 },
  celsius: { baseUnit: 'c', factor: 1 },
};

function getUnitDefinition(unit?: string | null): UnitDefinition {
  const normalized = (unit || 'ea').trim().toLowerCase();
  const definition = UNIT_MAP[normalized];

  if (!definition) {
    throw new BadRequestException(
      `Invalid unit. Allowed units: ${ALLOWED_INGREDIENT_UNITS.join(', ')}`,
    );
  }

  return definition;
}

function normalizeConversionRatio(conversionRatio?: number | null): number {
  if (conversionRatio === undefined || conversionRatio === null) {
    return 1;
  }

  const numericRatio = Number(conversionRatio);
  if (!Number.isFinite(numericRatio) || numericRatio <= 0) {
    throw new BadRequestException('conversionRatio must be greater than 0');
  }

  return numericRatio;
}

export function normalizeIngredientUnit(unit?: string | null): IngredientUnit {
  return getUnitDefinition(unit).baseUnit;
}

export function toBaseQuantity(
  quantity: number,
  unit?: string | null,
  conversionRatio?: number | null,
): number {
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity)) {
    throw new BadRequestException('Quantity must be a valid number');
  }

  const definition = getUnitDefinition(unit);
  const ratio = normalizeConversionRatio(conversionRatio);

  return numericQuantity * definition.factor * ratio;
}
