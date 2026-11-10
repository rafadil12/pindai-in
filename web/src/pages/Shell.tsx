import type { ReactNode } from "react";

export function Shell({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="/">
          <span className="mark" aria-hidden="true" />
          Pindai In
        </a>
        {aside}
      </header>
      {children}
    </div>
  );
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}
