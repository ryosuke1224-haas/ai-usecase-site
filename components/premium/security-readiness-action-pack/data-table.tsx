import type { ReactNode } from "react";
import { TABLE_SCROLL } from "./styles";

type DataTableProps = {
  label: string;
  columns: readonly string[];
  rows: readonly (readonly ReactNode[])[];
  monospaceHeader?: boolean;
};

/** Scrolls inside its own container so narrow screens never scroll the page sideways. */
export function DataTable({ label, columns, rows, monospaceHeader = false }: DataTableProps) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className={TABLE_SCROLL}>
      <table aria-label={label} className="w-full border-collapse text-left text-xs sm:text-sm">
        <thead className="bg-surface">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={`whitespace-nowrap border-b border-border/60 px-3 py-2 font-semibold text-foreground ${
                  monospaceHeader ? "font-mono text-xs" : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/40 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-3 py-2 align-top text-foreground">
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
