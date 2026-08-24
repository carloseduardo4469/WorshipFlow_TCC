export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="db-page-header">
      <p className="db-label mb-2 text-[#57d9eb]">WorshipFlow · Painel</p>
      <h1 className="db-title text-[clamp(2.35rem,5vw,4rem)] leading-[.94] text-[#f7f6f1]">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-[15px] font-medium leading-relaxed text-[#b8c5d3]">{description}</p>}
    </div>
  );
}
