export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <p className="db-label mb-2">WorshipFlow</p>
      <h1 className="db-title text-4xl leading-[1.02] text-paper sm:text-5xl">{title}</h1>
      {description && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}
