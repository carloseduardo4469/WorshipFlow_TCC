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
    return <div className="db-empty">{emptyMessage}</div>;
  }

  return (
    <div className="db-card overflow-hidden p-6">
      <table className="w-full text-left text-sm db-table">
        <thead className="bg-[color:#101a38] text-xs uppercase tracking-wide text-muted">
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
