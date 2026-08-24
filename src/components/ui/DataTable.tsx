export function DataTable({
  headers,
  children,
  emptyMessage,
  isEmpty,
}: {
  headers: string[];
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return <div className="db-empty db-empty-modern">{emptyMessage}</div>;
  }

  return (
    <div className="db-card db-data-table overflow-x-auto p-2 sm:p-3">
      <table className="w-full min-w-[620px] text-left text-sm db-table">
        <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">{children}</tbody>
      </table>
    </div>
  );
}
