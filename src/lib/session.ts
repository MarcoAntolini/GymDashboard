const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60; // 1 hour (demo)

type SessionPayload = {
	u: string;
	exp: number; // epoch seconds
};

function base64UrlEncodeBytes(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	const base64 =
		typeof btoa === "function"
			? btoa(binary)
			: typeof Buffer !== "undefined"
				? Buffer.from(binary, "binary").toString("base64")
				: (() => {
						throw new Error("No base64 encoder available");
					})();
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToBytes(s: string): Uint8Array {
	const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
	const binary =
		typeof atob === "function"
			? atob(base64)
			: typeof Buffer !== "undefined"
				? Buffer.from(base64, "base64").toString("binary")
				: (() => {
						throw new Error("No base64 decoder available");
					})();
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function textToBytes(s: string): Uint8Array {
	return new TextEncoder().encode(s);
}

function bytesToText(bytes: Uint8Array): string {
	return new TextDecoder().decode(bytes);
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let out = 0;
	for (let i = 0; i < a.length; i++) {
		out |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return out === 0;
}

function getSessionSecret(): string {
	const fromEnv = process.env.SESSION_SECRET;
	if (fromEnv && fromEnv.length >= 16) return fromEnv;
	if (process.env.NODE_ENV !== "production") {
		console.warn("[session] Missing/weak SESSION_SECRET; using insecure dev default. Set SESSION_SECRET for safer sessions.");
		return "dev-insecure-session-secret";
	}
	throw new Error("SESSION_SECRET is required in production (min length 16).");
}

let cachedKey: CryptoKey | null = null;
async function getHmacKey(): Promise<CryptoKey> {
	if (cachedKey) return cachedKey;
	const secretBytes = textToBytes(getSessionSecret());
	cachedKey = await crypto.subtle.importKey(
		"raw",
		secretBytes,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"]
	);
	return cachedKey;
}

async function hmacSignBase64Url(message: string): Promise<string> {
	const key = await getHmacKey();
	const sig = await crypto.subtle.sign("HMAC", key, textToBytes(message));
	return base64UrlEncodeBytes(new Uint8Array(sig));
}

export function getSessionCookieName() {
	return SESSION_COOKIE_NAME;
}

export function getSessionTtlSeconds() {
	return SESSION_TTL_SECONDS;
}

export function createSessionValue(username: string, nowEpochSeconds = Math.floor(Date.now() / 1000)) {
	const payload: SessionPayload = { u: username, exp: nowEpochSeconds + SESSION_TTL_SECONDS };
	const payloadJson = JSON.stringify(payload);
	const payloadB64 = base64UrlEncodeBytes(textToBytes(payloadJson));
	return { payloadB64, payload };
}

export async function signSessionValue(payloadB64: string) {
	const sigB64 = await hmacSignBase64Url(payloadB64);
	return `${payloadB64}.${sigB64}`;
}

export async function verifySessionValue(value: string, nowEpochSeconds = Math.floor(Date.now() / 1000)) {
	const [payloadB64, sigB64] = value.split(".");
	if (!payloadB64 || !sigB64) return null;
	const expectedSig = await hmacSignBase64Url(payloadB64);
	if (!constantTimeEqual(expectedSig, sigB64)) return null;
	let payload: SessionPayload;
	try {
		payload = JSON.parse(bytesToText(base64UrlDecodeToBytes(payloadB64))) as SessionPayload;
	} catch {
		return null;
	}
	if (!payload?.u || typeof payload.u !== "string") return null;
	if (!payload?.exp || typeof payload.exp !== "number") return null;
	if (payload.exp < nowEpochSeconds) return null;
	return payload;
}

