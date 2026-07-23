/** Mask a secret for list UI — length-preserving bullets; never returns the plaintext. */
export function maskSecret(value: string): string {
	if (!value) return "••••••••";
	return "•".repeat(value.length);
}
