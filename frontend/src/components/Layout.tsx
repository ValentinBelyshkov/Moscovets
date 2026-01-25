import { ReactNode } from "react";

interface LayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function Layout({ left, center, right }: LayoutProps) {
  return (
    <div className="app-shell">
      <div className="workspace">
        <section className="panel config-panel" style={{ flex: 0.8 }}>
          {left}
        </section>
        <section className="panel viewer" style={{ flex: 1.2 }}>
          {center}
        </section>
        <section className="panel viewer" style={{ flex: 1 }}>
          {right}
        </section>
      </div>
    </div>
  );
}