import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="db-page-header">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="db-page-title db-title text-[clamp(2.35rem,5vw,4rem)] leading-[.94]">{title}</h1>
          {description && <p className="db-page-description mt-3 max-w-2xl break-words text-[15px] font-medium leading-relaxed">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
