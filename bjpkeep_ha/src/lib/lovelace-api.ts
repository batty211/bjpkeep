import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,X-BJPKeep-Token,X-BJPKeep-Actor",
};

export function lovelaceOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function lovelaceJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

export function getLovelaceActor(req: Request): string {
  return req.headers.get("x-bjpkeep-actor") || "Lovelace";
}

export function isLovelaceAuthorized(req: Request): boolean {
  const configuredToken = process.env.LOVELACE_API_TOKEN;

  if (!configuredToken) {
    return false;
  }

  const auth = req.headers.get("authorization") || "";
  const bearerToken = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerToken = req.headers.get("x-bjpkeep-token");
  const queryToken = new URL(req.url).searchParams.get("token");
  const token = bearerToken || headerToken || queryToken;

  return token === configuredToken;
}

export function requireLovelaceAuth(req: Request): Response | null {
  if (isLovelaceAuthorized(req)) {
    return null;
  }

  return lovelaceJson(
    {
      error: "Unauthorized",
    },
    {
      status: 401,
    }
  );
}
