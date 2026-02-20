import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import dbPool, { queryRows } from "@/src/lib/db";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const HASH_BYTES = 64;
const SESSION_DAYS = 30;

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  preferredAiLanguage: string;
};

function toSha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, HASH_BYTES, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString("hex");
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`;
}

export function verifyPassword(password: string, hash: string) {
  const [algo, nStr, rStr, pStr, salt, digestHex] = hash.split("$");
  if (algo !== "scrypt" || !nStr || !rStr || !pStr || !salt || !digestHex) return false;
  const derived = scryptSync(password, salt, Buffer.from(digestHex, "hex").length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
  });
  const stored = Buffer.from(digestHex, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

export async function createUserSession(userId: number, ipAddress: string | null, userAgent: string | null) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = toSha256Hex(rawToken);
  await dbPool.query(
    `
    INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))
    `,
    [userId, tokenHash, ipAddress, userAgent, SESSION_DAYS],
  );
  return rawToken;
}

export function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function getAuthUserFromRequest(req: Request): Promise<AuthUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const tokenHash = toSha256Hex(token);
  const rows = await queryRows<{
    id: number;
    full_name: string;
    email: string;
    preferred_ai_language: string;
  }>(
    `
    SELECT u.id, u.full_name, u.email, u.preferred_ai_language
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash],
  );

  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    preferredAiLanguage: row.preferred_ai_language,
  };
}
