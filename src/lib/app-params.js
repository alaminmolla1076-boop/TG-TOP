// App parameters for the standalone (self-hosted) build.
// The previous Base44 SDK access token is gone — the app's identity is the
// Telegram initData, exactly as it already was for every real user.
const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
}

if (!isNode && isClearAccessTokenRequested()) {
	clearStoredAccessToken();
}

export const appParams = {
	appId: 'tg-top',
	token: undefined,
	functionsVersion: undefined,
	appBaseUrl: !isNode ? window.location.origin : ''
}