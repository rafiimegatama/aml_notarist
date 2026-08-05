import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  PIN_RESET_COOKIE_NAME,
  PIN_RESET_TOKEN_MINUTES,
  createPinResetToken,
  isValidOAuthState,
} from "@/lib/auth";
import { exchangeCodeForIdentity, getGoogleOAuthConfig } from "@/lib/googleOAuth";

// Lupa PIN — langkah 2. Google redirect ke sini setelah consent. Sengaja
// DIKECUALIKAN dari PIN gate (lihat proxy.ts matcher) — sama seperti
// start/route.ts, harus bisa diakses tanpa sesi.
export async function GET(request: NextRequest) {
  const forgotUrl = new URL("/lock/forgot", request.url);

  const config = getGoogleOAuthConfig();
  if (!config) {
    forgotUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(forgotUrl);
  }

  const params = request.nextUrl.searchParams;

  // Notaris klik "Batal" di layar consent Google, atau consent gagal.
  if (params.get("error")) {
    forgotUrl.searchParams.set("error", "denied");
    return NextResponse.redirect(forgotUrl);
  }

  const code = params.get("code");
  const stateParam = params.get("state") ?? undefined;
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const stateOk = isValidOAuthState(stateCookie, stateParam);

  if (!code || !stateOk) {
    forgotUrl.searchParams.set("error", "invalid_state");
    const response = NextResponse.redirect(forgotUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();

  let identity;
  try {
    identity = await exchangeCodeForIdentity(config, code, redirectUri);
  } catch {
    // Code sudah dipakai/kedaluwarsa, redirect_uri tidak cocok dengan yang
    // terdaftar di Google Console, dsb. — perlakukan sama seperti gagal
    // verifikasi, jangan bocorkan detail teknis ke notaris.
    identity = null;
  }

  const emailMatches =
    !!identity &&
    identity.emailVerified &&
    identity.email.toLowerCase() === config.recoveryEmail.toLowerCase();

  if (!emailMatches) {
    forgotUrl.searchParams.set("error", "email_mismatch");
    const response = NextResponse.redirect(forgotUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  const resetUrl = new URL("/lock/forgot/reset", request.url);
  const response = NextResponse.redirect(resetUrl);
  response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
  response.cookies.set(PIN_RESET_COOKIE_NAME, createPinResetToken(), {
    httpOnly: true,
    secure: false, // aplikasi lokal, diakses via http://127.0.0.1
    sameSite: "lax",
    path: "/",
    maxAge: PIN_RESET_TOKEN_MINUTES * 60,
  });
  return response;
}
