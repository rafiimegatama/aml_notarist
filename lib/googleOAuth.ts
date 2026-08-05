import { OAuth2Client } from "google-auth-library";

/**
 * FR-6B ekstensi — "Lupa PIN" diverifikasi lewat Sign-In With Google
 * (OAuth 2.0 Authorization Code, scope `openid email` SAJA — bukan scope
 * Gmail/Drive, jadi ini murni pembuktian identitas "akun Google mana yang
 * login", bukan izin baca data akun tersebut). Beda dari Service Account
 * yang dipakai lib/googleSheets & lib/googleDrive (autentikasi mesin-ke-
 * mesin) — ini konsen pengguna asli via layar consent Google, makanya app
 * ini akan muncul di akun Google notaris di bawah "Aplikasi pihak ketiga
 * dengan akses akun". Hanya SATU email yang boleh berhasil (dicocokkan
 * persis di lib/actions/pinRecovery.ts) — siapa pun bisa login Google, tapi
 * cuma pemilik email yang cocok dengan PIN_RECOVERY_GOOGLE_EMAIL yang
 * lolos. Lihat SETUP.md untuk cara membuat OAuth Client ID-nya.
 */
export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  recoveryEmail: string;
};

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const recoveryEmail = process.env.PIN_RECOVERY_GOOGLE_EMAIL;
  if (!clientId || !clientSecret || !recoveryEmail) return null;
  return { clientId, clientSecret, recoveryEmail };
}

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export function buildGoogleAuthUrl(
  config: GoogleOAuthConfig,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    access_type: "online", // sekali pakai untuk verifikasi identitas, tidak perlu refresh_token
    prompt: "select_account",
    login_hint: config.recoveryEmail, // pre-isi akun yang benar di account chooser, murni UX
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleIdentity = { email: string; emailVerified: boolean };

/**
 * Tukar authorization code dengan id_token, lalu verifikasi signature-nya
 * lewat google-auth-library (fetch+cache JWKS Google, cek audience & issuer
 * & masa berlaku) — BUKAN decode base64 manual, supaya token benar-benar
 * bisa dipastikan diterbitkan Google untuk client ID aplikasi ini.
 */
export async function exchangeCodeForIdentity(
  config: GoogleOAuthConfig,
  code: string,
  redirectUri: string
): Promise<GoogleIdentity | null> {
  const client = new OAuth2Client(config.clientId, config.clientSecret);
  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  if (!tokens.id_token) return null;

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) return null;

  return { email: payload.email, emailVerified: payload.email_verified === true };
}
