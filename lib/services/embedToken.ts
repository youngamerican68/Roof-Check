/**
 * Embed Token Service
 * Handles JWT signing and verification for widget sessions
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import crypto from 'crypto';

// Token configuration
const TOKEN_EXPIRY = '1h'; // 1 hour
const ALGORITHM = 'HS256';

interface EmbedTokenPayload extends JWTPayload {
  rooferId: string;
  rooferKey: string;
  domain: string;
  nonce: string;
  type: 'embed';
}

interface CampaignTokenPayload extends JWTPayload {
  rooferId: string;
  campaignId: string;
  campaignCode: string;
  nonce: string;
  type: 'campaign';
}

type TokenPayload = EmbedTokenPayload | CampaignTokenPayload;

/**
 * Get the secret key for signing tokens
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET or ENCRYPTION_KEY environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate a random nonce for session tracking
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sign an embed token for widget sessions
 */
export async function signEmbedToken(payload: {
  rooferId: string;
  rooferKey: string;
  domain: string;
}): Promise<string> {
  const nonce = generateNonce();

  const token = await new SignJWT({
    rooferId: payload.rooferId,
    rooferKey: payload.rooferKey,
    domain: payload.domain,
    nonce,
    type: 'embed',
  } as EmbedTokenPayload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer('roofcheck')
    .setAudience('widget')
    .sign(getSecretKey());

  return token;
}

/**
 * Sign a campaign token for QR code/campaign landing pages
 */
export async function signCampaignToken(payload: {
  rooferId: string;
  campaignId: string;
  campaignCode: string;
}): Promise<string> {
  const nonce = generateNonce();

  const token = await new SignJWT({
    rooferId: payload.rooferId,
    campaignId: payload.campaignId,
    campaignCode: payload.campaignCode,
    nonce,
    type: 'campaign',
  } as CampaignTokenPayload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer('roofcheck')
    .setAudience('campaign')
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode an embed token
 */
export async function verifyEmbedToken(token: string): Promise<EmbedTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'roofcheck',
      audience: 'widget',
    });

    if (payload.type !== 'embed') {
      return null;
    }

    return payload as EmbedTokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Verify and decode a campaign token
 */
export async function verifyCampaignToken(token: string): Promise<CampaignTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'roofcheck',
      audience: 'campaign',
    });

    if (payload.type !== 'campaign') {
      return null;
    }

    return payload as CampaignTokenPayload;
  } catch (error) {
    console.error('Campaign token verification failed:', error);
    return null;
  }
}

/**
 * Verify any token type
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'roofcheck',
    });

    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract nonce from a verified token for postMessage validation
 */
export function extractNonce(payload: TokenPayload): string {
  return payload.nonce;
}
