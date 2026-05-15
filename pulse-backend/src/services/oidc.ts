import { Issuer, generators, type Client, type TokenSet } from 'openid-client';
import { env } from '../config/env';
import { logger } from '../config/logger';

let _client: Client;

export async function initOidcClient(): Promise<void> {
  const issuer = await Issuer.discover('https://accounts.google.com');
  _client = new issuer.Client({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [env.GOOGLE_REDIRECT_URI],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
  });
  logger.info('OIDC client initialized');
}

export function getOidcClient(): Client {
  if (!_client) throw new Error('OIDC client not initialized');
  return _client;
}

export interface OAuthParams {
  state: string;
  nonce: string;
  codeVerifier: string;
  codeChallenge: string;
}

export function generateOAuthParams(): OAuthParams {
  const state = generators.state();
  const nonce = generators.nonce();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { state, nonce, codeVerifier, codeChallenge };
}

export function buildAuthorizationUrl(params: OAuthParams): string {
  return getOidcClient().authorizationUrl({
    scope: 'openid email profile',
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'select_account',
  });
}

export async function exchangeCode(
  callbackParams: Record<string, string>,
  oauthParams: OAuthParams
): Promise<TokenSet> {
  return getOidcClient().callback(env.GOOGLE_REDIRECT_URI, callbackParams, {
    state: oauthParams.state,
    nonce: oauthParams.nonce,
    code_verifier: oauthParams.codeVerifier,
  });
}

export interface OidcUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export async function fetchUserInfo(tokenSet: TokenSet): Promise<OidcUserInfo> {
  const info = await getOidcClient().userinfo(tokenSet);
  return {
    sub: info.sub,
    email: info.email as string,
    name: (info.name ?? info.email) as string,
    picture: info.picture as string | undefined,
    emailVerified: (info.email_verified ?? false) as boolean,
  };
}
