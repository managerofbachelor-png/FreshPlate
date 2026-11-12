const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeText(input: string, maxLength = 120): string {
  return String(input || '')
    .replace(CONTROL_CHARS_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSearchQuery(input: string, maxLength = 100): string {
  return String(input || '')
    .replace(CONTROL_CHARS_RE, '')
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  const clean = email.trim();
  return clean.length >= 3 && clean.length <= 160 && EMAIL_RE.test(clean);
}

export function isValidSafeId(id: string, maxLength = 64): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= maxLength && SAFE_ID_RE.test(id);
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function stripDangerousKeys<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripDangerousKeys(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      out[k] = stripDangerousKeys(v);
    }
    return out as T;
  }
  return input;
}

export type AuthRateBucket = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

interface RateBucketState {
  timestamps: number[];
  blockedUntil: number;
  violations: number;
}

const RATE_RULES: Record<AuthRateBucket, { maxAttempts: number; windowMs: number; baseCooldownMs: number }> = {
  login: { maxAttempts: 5, windowMs: 5 * 60_000, baseCooldownMs: 30_000 },
  register: { maxAttempts: 4, windowMs: 10 * 60_000, baseCooldownMs: 60_000 },
  forgot: { maxAttempts: 3, windowMs: 5 * 60_000, baseCooldownMs: 60_000 },
  reset: { maxAttempts: 5, windowMs: 5 * 60_000, baseCooldownMs: 30_000 },
  verify: { maxAttempts: 3, windowMs: 5 * 60_000, baseCooldownMs: 45_000 },
};

const STORAGE_KEY = 'mp_auth_rl_v1';

function readRateMap(): Partial<Record<AuthRateBucket, RateBucketState>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return stripDangerousKeys(parsed as Partial<Record<AuthRateBucket, RateBucketState>>);
  } catch {
    return {};
  }
}

function writeRateMap(data: Partial<Record<AuthRateBucket, RateBucketState>>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function checkAuthRateLimit(bucket: AuthRateBucket): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const map = readRateMap();
  const state = map[bucket];
  if (!state) return { allowed: true, retryAfterSec: 0 };

  if (state.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordAuthAttempt(bucket: AuthRateBucket): { blocked: boolean; retryAfterSec: number } {
  const now = Date.now();
  const rule = RATE_RULES[bucket];
  const map = readRateMap();
  const prev = map[bucket] || { timestamps: [], blockedUntil: 0, violations: 0 };

  const recent = prev.timestamps.filter((t) => now - t < rule.windowMs);
  recent.push(now);

  if (recent.length > rule.maxAttempts) {
    const nextViolations = Math.min(prev.violations + 1, 4);
    const cooldownMs = rule.baseCooldownMs * Math.pow(2, nextViolations - 1);
    const blockedUntil = now + cooldownMs;
    map[bucket] = {
      timestamps: recent,
      blockedUntil,
      violations: nextViolations,
    };
    writeRateMap(map);
    return { blocked: true, retryAfterSec: Math.ceil(cooldownMs / 1000) };
  }

  map[bucket] = {
    timestamps: recent,
    blockedUntil: 0,
    violations: prev.violations,
  };
  writeRateMap(map);
  return { blocked: false, retryAfterSec: 0 };
}

export function resetAuthRateLimit(bucket: AuthRateBucket): void {
  const map = readRateMap();
  if (map[bucket]) {
    delete map[bucket];
    writeRateMap(map);
  }
}
