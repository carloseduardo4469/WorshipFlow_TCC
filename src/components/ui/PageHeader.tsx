export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="db-page-header">
      <p className="db-page-kicker db-label mb-2">WorshipFlow · Painel</p>
      <h1 className="db-page-title db-title text-[clamp(2.35rem,5vw,4rem)] leading-[.94]">{title}</h1>
      {description && <p className="db-page-description mt-3 max-w-2xl break-words text-[15px] font-medium leading-relaxed">{description}</p>}
    </div>
  );
}
