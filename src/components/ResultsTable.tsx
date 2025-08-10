import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  ColumnResizeMode,
} from "@tanstack/react-table";
import { ArrowUpDown, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

export type MetricRow = {
  ticker: string;
  marketCap: number;
  sharesOutstanding: number;
  debt: number;
  cash: number;
  revenue: number;
  ebitda: number;
  eps: number;
  ev: number;
  evRevenueLTM: number;
  evEbitdaLTM: number;
  evEbitdaNTM: number;
  peLTM: number;
  peNTM: number;
};

const numericFormatter = (n: number) =>
  Number.isFinite(n) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n) : "-";

function computeMedians(rows: MetricRow[]) {
  const keys: (keyof MetricRow)[] = [
    "marketCap","sharesOutstanding","debt","cash","revenue","ebitda","eps","ev","evRevenueLTM","evEbitdaLTM","evEbitdaNTM","peLTM","peNTM"
  ];
  const medians: Partial<Record<keyof MetricRow, number>> = {};
  keys.forEach((k) => {
    const vals = rows.map((r) => r[k] as number).filter((v) => typeof v === "number" && Number.isFinite(v)) as number[];
    if (vals.length) {
      const sorted = [...vals].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medians[k] = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
  });
  return medians;
}

interface ResultsTableProps {
  data: MetricRow[];
  onChange?: (rows: MetricRow[]) => void;
}

export function ResultsTable({ data, onChange }: ResultsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnResizeMode] = React.useState<ColumnResizeMode>("onChange");

  const medians = React.useMemo(() => computeMedians(data), [data]);

  const columns = React.useMemo<ColumnDef<MetricRow, unknown>[]>(
    () => [
      {
        id: "actions",
        header: "",
        cell: (info) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const idx = info.row.index;
              const next = data.filter((_, i) => i !== idx);
              onChange?.(next);
            }}
            aria-label="Delete row"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
        size: 40,
        minSize: 40,
        maxSize: 40,
      },
      {
        accessorKey: "ticker",
        header: "Ticker",
        cell: (info) => {
          const v = info.getValue<string>() ?? "";
          const idx = info.row.index;
          return (
            <Input
              value={v}
              onChange={(e) => {
                const next = data.map((r, i) => (i === idx ? { ...r, ticker: e.target.value.toUpperCase() } : r));
                onChange?.(next);
              }}
              className="h-8"
            />
          );
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      ...(["marketCap","sharesOutstanding","debt","cash","revenue","ebitda","eps","ev","evRevenueLTM","evEbitdaLTM","evEbitdaNTM","peLTM","peNTM"] as (keyof MetricRow)[]).map((key) => ({
        accessorKey: key,
        header: String(
          key
        )
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase()),
        cell: (info: { getValue: () => number; row: { index: number } }) => {
          const v = info.getValue() as number;
          const idx = info.row.index;
          const isMedian = medians[key] !== undefined && Math.abs((medians[key] as number) - v) < 1e-6;
          return (
            <Input
              type="number"
              value={Number.isFinite(v) ? v : ""}
              onChange={(e) => {
                const val = e.target.value === "" ? NaN : Number(e.target.value);
                const next = data.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
                onChange?.(next);
              }}
              className={`h-8 ${isMedian ? "bg-accent" : ""}`}
            />
          );
        },
        size: 110,
        minSize: 90,
        maxSize: 130,
      })),
    ],
    [data, medians, onChange]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode,
    defaultColumn: { size: 110, minSize: 90, maxSize: 130 },
  });

  const exportXlsx = () => {
    const allCols = table.getVisibleLeafColumns();
    const cols = allCols.filter((c) => c.id !== "actions");
    const headers = cols.map((c) => c.columnDef.header as string);
    const rows = table.getRowModel().rows.map((r) =>
      r
        .getVisibleCells()
        .filter((c) => c.column.id !== "actions")
        .map((c) => {
          const v = c.getValue<unknown>();
          return typeof v === "number" ? Number(v.toFixed(4)) : v;
        })
    );

    // Append median row
    const medianRow = cols.map((c) => {
      const key = c.id as keyof MetricRow;
      if (key === "ticker") return "Median";
      const mv = medians[key];
      return typeof mv === "number" ? Number(mv.toFixed(4)) : "";
    });

    const aoa = [headers, ...rows, medianRow];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comps");
    XLSX.writeFile(wb, "comps.xlsx");
  };

  return (
    <section className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Input
          placeholder="Filter tickers or values..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="secondary"
          onClick={() => onChange?.([...data, {
            ticker: "",
            marketCap: NaN,
            sharesOutstanding: NaN,
            debt: NaN,
            cash: NaN,
            revenue: NaN,
            ebitda: NaN,
            eps: NaN,
            ev: NaN,
            evRevenueLTM: NaN,
            evEbitdaLTM: NaN,
            evEbitdaNTM: NaN,
            peLTM: NaN,
            peNTM: NaN,
          }])}
          aria-label="Add row"
        >
          <Plus className="mr-1 h-4 w-4" /> Add row
        </Button>
        <Button variant="secondary" className="ml-auto" onClick={exportXlsx} aria-label="Download XLSX">
          <Download />
          Download .xlsx
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full text-sm" style={{ minWidth: 'max-content' }}>
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-3 py-2 text-left font-medium border-b relative select-none whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="opacity-60" />
                        </button>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none ${
                            header.column.getIsResizing() ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-accent/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cellCls(cell)} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Median row */}
              {data.length > 0 && (
                <tr className="bg-accent/60 font-medium">
                  {table.getVisibleLeafColumns().map((col) => {
                    if (col.id === "actions") {
                      return <td key={col.id} className="px-3 py-2 border-t" />;
                    }
                    const key = col.id as keyof MetricRow;
                    return (
                      <td key={col.id} className="px-3 py-2 border-t">
                        {key === "ticker" ? "Median" : numericFormatter(medians[key] as number)}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function hdr(label: string) {
  return () => <div className="font-medium">{label}</div>;
}

// numericCell and other helpers removed in favor of inline editable inputs
function cellCls(cell: { column: { getSize: () => number } }) {
  return "px-3 py-2 border-b align-middle";
}
