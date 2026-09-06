import { ReactNode } from "react";

export default function PageHeader({
  kicker,
  title,
  actions,
}: {
  kicker: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4 md:px-8">
      <div>
        <div className="kicker">{kicker}</div>
        <h1 className="display mt-0.5 text-[30px] leading-[0.9]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
