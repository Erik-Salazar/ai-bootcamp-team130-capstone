import { Link } from "react-router-dom";
import { getSafeAppLink, getSafeExplorerUrl, getSafeExternalUrl } from "../lib/security/safe-url";

interface SafeExternalLinkProps {
  href: string | null | undefined;
  className?: string;
  children: React.ReactNode;
  explorer?: boolean;
}

export default function SafeExternalLink({
  href,
  className,
  children,
  explorer = false,
}: SafeExternalLinkProps) {
  const safeHref = explorer ? getSafeExplorerUrl(href) : getSafeExternalUrl(href);
  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

interface SafeAppLinkProps {
  href: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}

export function SafeAppLink({ href, className, children }: SafeAppLinkProps) {
  const safePath = getSafeAppLink(href);
  if (!safePath) return null;

  return (
    <Link to={safePath} className={className}>
      {children}
    </Link>
  );
}
