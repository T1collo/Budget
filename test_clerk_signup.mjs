// Run: node test_clerk_signup.mjs
//
// Guards the failure that made every social sign-up button hang forever:
// Clerk bot protection was enabled on sign-up, so clerk-js waited for a
// Cloudflare Turnstile token before it would POST /v1/client/sign_ups. The
// development instance's Turnstile key never issued one (error 600010), so the
// request was never sent, the button sat disabled, and nothing in the UI ever
// said why.
//
// This asserts the CONFIGURATION that caused it, because a script cannot solve
// a CAPTCHA and therefore cannot test the flow end to end. Exits non-zero while
// social sign-up would still hang.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pk =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  readFileSync(new URL("./.env", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"))
    ?.split("=")
    .slice(1)
    .join("=")
    .trim()
    .replace(/^["']|["']$/g, "");

assert.ok(pk, "no NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY found");

// A publishable key is the frontend API host, base64'd, with a trailing "$".
const frontendApi = Buffer.from(pk.replace(/^pk_(test|live)_/, ""), "base64")
  .toString()
  .replace(/\$$/, "");

const res = await fetch(
  `https://${frontendApi}/v1/environment?__clerk_api_version=2021-02-05&_clerk_js_version=5.35.0`
);
assert.equal(res.status, 200, `Clerk environment fetch failed: ${res.status}`);
const env = await res.json();

const signUp = env.user_settings?.sign_up ?? {};
const display = env.display_config ?? {};
const social = Object.entries(env.user_settings?.social ?? {})
  .filter(([, v]) => v.enabled)
  .map(([k]) => k);

console.log(`instance      : ${frontendApi} (${display.instance_environment_type})`);
console.log(`social        : ${social.join(", ") || "none"}`);
console.log(`captcha       : enabled=${signUp.captcha_enabled} widget=${signUp.captcha_widget_type}`);
console.log(`oauth bypass  : ${JSON.stringify(display.captcha_oauth_bypass ?? [])}`);

const bypass = display.captcha_oauth_bypass ?? [];
const gated = social.filter((s) => !bypass.includes(s));

// The actual regression guard. Either bot protection is off for sign-up, or
// every enabled social provider is exempt from it. Anything else reproduces
// the hang, because the OAuth redirect is withheld pending a token the widget
// never delivers.
if (signUp.captcha_enabled && gated.length > 0) {
  console.error(
    `\nFAIL: bot protection gates social sign-up for: ${gated.join(", ")}.\n` +
      `Clicking those buttons will hang with no error.\n` +
      `Fix: Clerk Dashboard -> Protect -> Rules -> turn off bot sign-up\n` +
      `protection for this instance.`
  );
  process.exit(1);
}

// A development instance on a public domain is what made the Turnstile key
// fail in the first place, so flag it even once the gate is off.
if (display.instance_environment_type !== "production") {
  console.warn(
    `\nWARN: this is a ${display.instance_environment_type} instance. It shows a\n` +
      `"Development mode" badge, is capped at 100 users, and uses Clerk's shared\n` +
      `dev CAPTCHA keys. Move to a production instance before real users arrive.`
  );
}

console.log("\nclerk sign-up config: social sign-up is not CAPTCHA-blocked");
