export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return emailPattern.test(value.trim());
}

export function hasMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function isValidPhone(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 8;
}

export function calculatePasswordStrength(
  password: string,
): "Weak" | "Medium" | "Strong" {
  const lengthScore = password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const complexityScore = [hasLower, hasUpper, hasDigit, hasSpecial].filter(
    Boolean,
  ).length;
  const score = lengthScore + complexityScore;

  if (score >= 5) {
    return "Strong";
  }

  if (score >= 3) {
    return "Medium";
  }

  return "Weak";
}

export function isNonNegativeNumber(value: string): boolean {
  if (value.trim() === "") {
    return false;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}
