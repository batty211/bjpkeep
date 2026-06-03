"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode, createContext, useContext } from "react";

// Context to store the ingress path
const IngressContext = createContext<string>("");

export function IngressProvider({ children, path }: { children: ReactNode, path: string }) {
  return <IngressContext.Provider value={path}>{children}</IngressContext.Provider>;
}

/**
 * Gets the current ingress path from context.
 */
export function useIngressPath(): string {
  return useContext(IngressContext);
}

/**
 * Prefixes a path with the current ingress path
 */
export function getPrefixedPath(path: string, prefix: string): string {
  if (prefix && path.startsWith("/") && !path.startsWith(prefix)) {
    return prefix + path;
  }
  // Force relative path if not prefixed
  if (path.startsWith("/")) {
    return "." + path;
  }
  return path;
}

/**
 * A fetch wrapper that automatically adds the Ingress prefix (Client-side)
 */
export function usePrefixedFetch() {
  const prefix = useIngressPath();
  return async (url: string, options?: RequestInit) => {
    return fetch(getPrefixedPath(url, prefix), options);
  };
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
  const prefix = useIngressPath();
  const prefixedHref = getPrefixedPath(href as string, prefix);

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
