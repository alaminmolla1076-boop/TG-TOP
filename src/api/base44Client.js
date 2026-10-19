// Standalone API client for the self-hosted (Vercel) build.
// Identical surface to the previous Base44 SDK client — `functions.invoke`,
// `app.getPublicSettings`, `auth` — so every page keeps working unchanged.
// All calls go straight to the app's own Supabase edge function (b44fn),
// which hosts the exact same handlers the bot uses. The only identity is the
// Telegram initData, verified server-side with the bot token — exactly as before.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://kiglmpxkilgwzkuewuvb.supabase.co').replace(/\/+$/, '');

// The frontend-facing handlers are registered on the b44fn router with a
// "web" prefix so they can never shadow the bot's own functions.
const webHandler = (name) => 'web' + String(name).charAt(0).toUpperCase() + String(name).slice(1);

async function invoke(name, payload = {}) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/b44fn/${webHandler(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  } catch (e) {
    const error = new Error(e?.message || 'Network error — check your connection');
    error.response = { data: { error: error.message } };
    throw error;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.response = { data };
    throw error;
  }
  return { data };
}

// Email/password accounts never carried app data (the app's identity is the
// Telegram initData), so these only inform the user. The Telegram flow —
// which is how every real user signs in — is unchanged.
const authUnavailable = async () => {
  const error = new Error('Sign in by opening this app from the Telegram bot');
  error.status = 401;
  throw error;
};

export const base44 = {
  functions: {
    invoke
  },
  app: {
    // Nothing in the app reads public settings beyond the auth context's
    // loading gate; resolve immediately with the app's own identity.
    getPublicSettings: async () => ({ id: 'tg-top', public_settings: {} })
  },
  auth: {
    me: authUnavailable,
    isAuthenticated: async () => false,
    loginViaEmailPassword: authUnavailable,
    loginWithProvider: authUnavailable,
    register: authUnavailable,
    verifyOtp: authUnavailable,
    resendOtp: authUnavailable,
    setToken: () => {},
    resetPasswordRequest: authUnavailable,
    resetPassword: authUnavailable,
    redirectToLogin: () => {},
    logout: () => {
      try {
        window.localStorage.removeItem('base44_access_token');
        window.localStorage.removeItem('token');
      } catch { /* storage unavailable */ }
    }
  }
};