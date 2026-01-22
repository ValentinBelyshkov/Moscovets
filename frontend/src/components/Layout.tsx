import { ReactNode } from "react";

interface LayoutProps {
  left: ReactNode;
  right: ReactNode;
  bottom: ReactNode;
}

export function Layout({ left, right, bottom }: LayoutProps) {
  return (
    <div className="app-shell">
      <div className="workspace">
        <section className="panel viewer" style={{ flex: 1.2 }}>
          {left}
        </section>
        <section className="panel viewer" style={{ flex: 1 }}>
          {right}
        </section>
      </div>
      <section className="panel lower-panel">{bottom}</section>
    </div>
  );
}