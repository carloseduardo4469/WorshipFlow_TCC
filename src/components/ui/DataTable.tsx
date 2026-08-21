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
    return (
      <div className="rounded-xl border border-dashed border-paper/15 px-6 py-12 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-paper/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper/5 text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-paper/10">{children}</tbody>
      </table>
    </div>
  );
}
