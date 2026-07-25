export type TableRow = { cells?: string[] };

/**
 * Sanity has no native table type, so this renders the `dataTable` object.
 *
 * The wrapper scrolls horizontally on its own — a wide compliance table must
 * never make the whole page scroll sideways on a phone, which is the single
 * most common mobile layout failure on content sites.
 */
export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption?: string;
  headers: string[];
  rows: TableRow[];
}) {
  if (headers.length === 0) return null;

  return (
    <div className="mt-7 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--brand-line)]">
      <table className="w-full border-collapse text-left text-[15px]">
        {caption && (
          <caption className="px-4 py-3 text-left text-[14px] text-[var(--brand-muted)]">
            {caption}
          </caption>
        )}
        <thead className="bg-[var(--brand-primary-tint)]">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap px-4 py-3 font-semibold text-[var(--brand-primary)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-[var(--brand-line)] align-top"
            >
              {(row.cells ?? []).map((cell, j) => (
                <td key={j} className="px-4 py-3 leading-[1.6]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
