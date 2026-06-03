"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

/**
 * Gets the current ingress path.
 * Tries the cookie first, then falls back to detecting it from the URL.
 */
export function getIngressPath(): string {
  if (typeof document === "undefined") return "";
  
  // 1. Try cookie
  const value = `; ${document.cookie}`;
  const parts = value.split(`; bjpkeep-ingress-path=`);
  if (parts.length === 2) {
    const cookiePath = parts.pop()?.split(";").shift();
    if (cookiePath) return cookiePath;
  }

  // 2. Fallback: Detect from URL (Home Assistant Ingress pattern)
  // Matches: /api/hassio_ingress/some_token/
  const match = window.location.pathname.match(/^\/api\/hassio_ingress\/[^\/]+\//);
  if (match) {
    return match[0].replace(/\/$/, ""); // Remove trailing slash
  }

  return "";
}

/**
 * Prefixes a path with the current ingress path (client-side)
 */
export function getPrefixedPath(path: string): string {
  if (typeof document === "undefined") return path;

  const prefix = getIngressPath();
  if (prefix && path.startsWith("/") && !path.startsWith(prefix)) {
    return prefix + path;
  }
  return path;
}

/**
 * A fetch wrapper that automatically adds the Ingress prefix
 */
export async function prefixedFetch(url: string, options?: RequestInit) {
  return fetch(getPrefixedPath(url), options);
}

interface BaseLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  href: string;
}

/**
 * A wrapper around Next.js Link that automatically prepends the Ingress path.
 */
export function BaseLink({ href, children, ...props }: BaseLinkProps) {
  const prefixedHref = getPrefixedPath(href);

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
