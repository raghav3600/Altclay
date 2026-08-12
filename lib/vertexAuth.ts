import { SignJWT, importPKCS8 } from "jose";

type VertexAccessTokenConfig = {
  projectId: string;
  location: string;
  accessToken: string;
};

type VertexServiceAccountConfig = {
  projectId: string;
  location: string;
  clientEmail: string;
  privateKey: string;
  tokenUri: string;
};

export type VertexConfig = VertexAccessTokenConfig | VertexServiceAccountConfig;

function normalizePrivateKey(privateKey: string): string {
  return privateKey.includes("\\n") ? privateKey.replace(/\\n/g, "\n") : privateKey;
}

function isAccessTokenConfig(config: VertexConfig): config is VertexAccessTokenConfig {
  return (config as VertexAccessTokenConfig).accessToken !== undefined;
}

export function parseVertexConfig(rawApiKey: string): VertexConfig | null {
  try {
    const parsed = JSON.parse(rawApiKey) as Record<string, string | undefined>;

    // Short format:
    // { "projectId":"...", "location":"...", "accessToken":"..." }
    if (parsed.projectId && parsed.location && parsed.accessToken) {
      return {
        projectId: parsed.projectId,
        location: parsed.location,
        accessToken: parsed.accessToken,
      };
    }

    // Service-account format from Google Cloud JSON:
    // { "project_id":"...", "client_email":"...", "private_key":"...", "token_uri":"..." }
    if (parsed.project_id && parsed.client_email && parsed.private_key && parsed.token_uri) {
      return {
        projectId: parsed.project_id,
        location: parsed.location || "us-central1",
        clientEmail: parsed.client_email,
        privateKey: normalizePrivateKey(parsed.private_key),
        tokenUri: parsed.token_uri,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getVertexAccessToken(config: VertexConfig): Promise<string> {
  if (isAccessTokenConfig(config)) {
    return config.accessToken;
  }

  const alg = "RS256";
  const now = Math.floor(Date.now() / 1000);

  const key = await importPKCS8(config.privateKey, alg);

  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuer(config.clientEmail)
    .setSubject(config.clientEmail)
    .setAudience(config.tokenUri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const tokenRes = await fetch(config.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to mint Vertex access token: ${tokenRes.status} ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Failed to mint Vertex access token: missing access_token");
  }

  return tokenData.access_token;
}
