"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode, useEffect, useState } from "react";

/**
 * Gets the current ingress path from the cookie set by middleware
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
 * A wrapper around Next.js Link that automatically prepends the Ingress path (Client Component)
 */
export function BaseLink({ href, children, ...props }: BaseLinkProps) {
  const [prefixedHref, setPrefixedHref] = useState(href);

  useEffect(() => {
    setPrefixedHref(getPrefixedPath(href));
  }, [href]);

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
