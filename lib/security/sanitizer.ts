/**
 * Input sanitizer – detect threats: prompt injection, PII, credentials, SQLi, SSRF.
 * [SEC REVIEW REQUIRED]
 */

export type ThreatType =
  | "PROMPT_INJECTION"
  | "PII_IN_METADATA"
  | "CREDENTIAL_PATTERN"
  | "SQL_INJECTION"
  | "SSRF";

export type Threat = {
  type: ThreatType;
  message: string;
  field?: string;
};

export type SanitizeResult = {
  sanitized: string;
  threats: Threat[];
};

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /system\s*:\s*/i,
  /\[INST\]|\[\/INST\]/i,
  /<\s*script\s*>/i,
  /jailbreak|DAN\s+mode/i,
  /you\s+are\s+now\s+/i,
  /disregard\s+(your|all)/i
];

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{16}\b/, // Credit card (simplified)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/, // Email in free text
  /\b\d{10,11}\b/ // Phone
];

const CREDENTIAL_PATTERNS = [
  /password\s*=\s*["']?[^"'\s]{8,}/i,
  /api[_-]?key\s*=\s*["']?[a-zA-Z0-9_-]{20,}/i,
  /secret\s*=\s*["']?[^"'\s]{8,}/i,
  /bearer\s+[a-zA-Z0-9_-]{20,}/i,
  /sk-[a-zA-Z0-9]{32,}/i, // OpenAI-style key
  /ghp_[a-zA-Z0-9]{36}/i // GitHub PAT
];

const SQL_INJECTION_PATTERNS = [
  /(\s|^)(union|select|insert|update|delete|drop|exec|execute)\s+/i,
  /--\s*$/,
  /;\s*drop\s+table/i,
  /'\s*or\s+'1'\s*=\s*'1/i,
  /\bxp_\w+/i
];

const SSRF_PATTERNS = [
  /https?:\/\/localhost(?::\d+)?/i,
  /https?:\/\/127\.0\.0\.1(?::\d+)?/i,
  /https?:\/\/0\.0\.0\.0/i,
  /https?:\/\/\[::1\]/i,
  /https?:\/\/169\.254\.\d+\.\d+/i, // AWS metadata
  /https?:\/\/metadata\.google\.internal/i
];

function detectThreats(value: string, field?: string): Threat[] {
  const threats: Threat[] = [];

  for (const p of PROMPT_INJECTION_PATTERNS) {
    if (p.test(value)) {
      threats.push({ type: "PROMPT_INJECTION", message: "Potential prompt injection", field });
      break;
    }
  }

  for (const p of PII_PATTERNS) {
    if (p.test(value)) {
      threats.push({ type: "PII_IN_METADATA", message: "PII detected in metadata", field });
      break;
    }
  }

  for (const p of CREDENTIAL_PATTERNS) {
    if (p.test(value)) {
      threats.push({ type: "CREDENTIAL_PATTERN", message: "Credential pattern detected", field });
      break;
    }
  }

  for (const p of SQL_INJECTION_PATTERNS) {
    if (p.test(value)) {
      threats.push({ type: "SQL_INJECTION", message: "Potential SQL injection", field });
      break;
    }
  }

  for (const p of SSRF_PATTERNS) {
    if (p.test(value)) {
      threats.push({ type: "SSRF", message: "Potential SSRF – internal URL", field });
      break;
    }
  }

  return threats;
}

function sanitizeString(value: string): string {
  return value
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim();
}

/**
 * Sanitize a single input string.
 */
export function sanitizeInput(input: string, field?: string): SanitizeResult {
  const sanitized = sanitizeString(input);
  const threats = detectThreats(sanitized, field);
  return { sanitized, threats };
}

/**
 * Sanitize an object's string fields. Returns sanitized copy and all threats.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  urlFields: string[] = []
): { sanitized: T; threats: Threat[] } {
  const sanitized = { ...obj } as T;
  const allThreats: Threat[] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      const { sanitized: s, threats } = sanitizeInput(val, key);
      (sanitized as Record<string, unknown>)[key] = s;
      allThreats.push(...threats);
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      const nested = sanitizeObject(val as Record<string, unknown>, urlFields);
      (sanitized as Record<string, unknown>)[key] = nested.sanitized;
      allThreats.push(...nested.threats);
    }
  }

  return { sanitized, threats: allThreats };
}
