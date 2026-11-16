import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "./vercel-types";

const cookieName = "av_admin_session";
const sessionSeconds = 8 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be 32+ characters");
  return value;
}

function signature(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export async function sign(username: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    role: "admin",
    username,
    iat: now,
    exp: now + sessionSeconds,
  })).toString("base64url");
  const content = header + "." + payload;
  return content + "." + signature(content);
}

export async function check(req: VercelRequest) {
  const cookieHeader = req.headers.cookie || "";
  const raw = cookieHeader.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  if (!raw) return false;

  try {
    const token = decodeURIComponent(raw);
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerPart, payloadPart, suppliedSignature] = parts;
    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
    if (header.alg !== "HS256") return false;

    const content = headerPart + "." + payloadPart;
    const expected = Uint8Array.from(Buffer.from(signature(content), "base64url"));
    const actual = Uint8Array.from(Buffer.from(suppliedSignature, "base64url"));
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
    return payload.role === "admin"
      && typeof payload.exp === "number"
      && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function setCookie(res: VercelResponse, token: string) {
  res.setHeader("Set-Cookie", cookieName + "=" + encodeURIComponent(token)
    + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + sessionSeconds);
}

export function clearCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", cookieName + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
}

export function originOk(req: VercelRequest) {
  const expected = process.env.APP_URL;
  if (!expected) return false;
  return req.headers.origin === new URL(expected).origin;
}
