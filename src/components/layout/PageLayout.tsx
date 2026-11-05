import type { ReactNode } from "react";

interface PageLayoutProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

function PageLayout({
  header,
  children,
  className = ""
}: PageLayoutProps) {
  return (
    <section className={`page-layout ${className}`.trim()}>
      <div className="page-layout-header">
        {header}
      </div>

      <div className="page-layout-content">
        {children}
      </div>
    </section>
  );
}

export default PageLayout;
