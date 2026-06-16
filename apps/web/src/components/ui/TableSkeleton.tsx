'use client';

type Props = {
  /** Number of columns in the table (matches the header cell count). */
  cols: number;
  /** Number of placeholder rows to render while loading. Defaults to 6. */
  rows?: number;
};

/**
 * Shimmer placeholder rows for a loading table. Drop it straight into the
 * `loading` branch of a `<tbody>` in place of a bare "Memuat..." row so the
 * table keeps its shape while data is fetched:
 *
 *   {loading ? <TableSkeleton cols={5} /> : rows.map(...)}
 */
export default function TableSkeleton({ cols, rows = 6 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
