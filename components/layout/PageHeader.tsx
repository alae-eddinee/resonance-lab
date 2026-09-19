import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-divider)] px-4 py-5 md:flex-row md:items-start md:justify-between md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold md:text-[2rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
