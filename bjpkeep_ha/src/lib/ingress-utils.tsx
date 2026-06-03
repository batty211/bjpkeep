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

interface BaseLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  href: string;
}

/**
 * A wrapper around Next.js Link that automatically prepends the Ingress path
 */
export function BaseLink({ href, children, ...props }: BaseLinkProps) {
  const [prefixedHref, setPrefixedHref] = useState(href);

  useEffect(() => {
    const prefix = getIngressPath();
    if (prefix && href.startsWith("/") && !href.startsWith(prefix)) {
      setPrefixedHref(prefix + href);
    } else {
      setPrefixedHref(href);
    }
  }, [href]);

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
