"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

/**
 * Gets the current ingress path from the cookie set by middleware
 * This is synchronous and can be used during render on the client.
 */
export function getIngressPath(): string {
  if (typeof document === "undefined") return "";
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; bjpkeep-ingress-path=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || "";
  }
  return "";
}

/**
 * Prefixes a path with the current ingress path (client-side)
 */
export function getPrefixedPath(path: string): string {
  // If we are on the server, we can't reliably get the prefix without headers
  // But this utility is mainly for client-side Link and Fetch
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
 * This version resolves the prefix synchronously during render to prevent 404s during prefetch.
 */
export function BaseLink({ href, children, ...props }: BaseLinkProps) {
  // Resolve prefix immediately during render
  const prefixedHref = getPrefixedPath(href);

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
