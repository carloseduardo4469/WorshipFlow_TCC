import { Children, cloneElement, isValidElement, type ReactNode } from "react";

export function DataTable({
  headers,
  children,
  emptyMessage,
  isEmpty,
}: {
  headers: string[];
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return <div className="db-empty db-empty-modern">{emptyMessage}</div>;
  }

  const rows = Children.toArray(children).map((row) => {
    if (!isValidElement<{ children?: ReactNode; className?: string }>(row)) return row;
    const cells = Children.toArray(row.props.children).map((cell, index) => {
      if (!isValidElement<{ className?: string }>(cell)) return cell;
      return cloneElement(cell, { "data-label": headers[index] });
    });
    return cloneElement(row, {
      className: `${row.props.className ?? ""} db-responsive-row`.trim(),
      children: cells,
    });
  });

  return (
    <div className="db-card db-data-table db-responsive-table p-2 sm:p-3">
      <table className="w-full text-left text-sm db-table">
        <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:rgba(148,163,184,0.1)]">{rows}</tbody>
      </table>
    </div>
  );
}
