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
import { ArrowUpDown, Download } from "lucide-react";
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
}

export function ResultsTable({ data }: ResultsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnResizeMode] = React.useState<ColumnResizeMode>("onChange");

  const medians = React.useMemo(() => computeMedians(data), [data]);

  const columns = React.useMemo<ColumnDef<MetricRow, any>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: "Ticker",
        cell: (info) => <span className="font-medium">{info.getValue<string>()}</span>,
        size: 120,
      },
      { accessorKey: "marketCap", header: "Market Cap", cell: numericCell("marketCap", medians), size: 160 },
      { accessorKey: "sharesOutstanding", header: "Shares Out", cell: numericCell("sharesOutstanding", medians), size: 150 },
      { accessorKey: "debt", header: "Debt", cell: numericCell("debt", medians), size: 130 },
      { accessorKey: "cash", header: "Cash", cell: numericCell("cash", medians), size: 130 },
      { accessorKey: "revenue", header: "Revenue", cell: numericCell("revenue", medians), size: 150 },
      { accessorKey: "ebitda", header: "EBITDA", cell: numericCell("ebitda", medians), size: 150 },
      { accessorKey: "eps", header: "EPS", cell: numericCell("eps", medians), size: 120 },
      { accessorKey: "ev", header: "EV", cell: numericCell("ev", medians), size: 140 },
      { accessorKey: "evRevenueLTM", header: "EV/Revenue LTM", cell: numericCell("evRevenueLTM", medians), size: 170 },
      { accessorKey: "evEbitdaLTM", header: "EV/EBITDA LTM", cell: numericCell("evEbitdaLTM", medians), size: 170 },
      { accessorKey: "evEbitdaNTM", header: "EV/EBITDA NTM", cell: numericCell("evEbitdaNTM", medians), size: 170 },
      { accessorKey: "peLTM", header: "P/E LTM", cell: numericCell("peLTM", medians), size: 140 },
      { accessorKey: "peNTM", header: "P/E NTM", cell: numericCell("peNTM", medians), size: 140 },
    ],
    [medians]
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
    defaultColumn: { size: 140, minSize: 80, maxSize: 400 },
  });

  const exportXlsx = () => {
    const headers = table.getVisibleLeafColumns().map((c) => c.columnDef.header as string);
    const rows = table.getRowModel().rows.map((r) =>
      r.getVisibleCells().map((c) => {
        const v = c.getValue<any>();
        return typeof v === "number" ? Number(v.toFixed(4)) : v;
      })
    );

    // Append median row
    const medianRow = table.getVisibleLeafColumns().map((c) => {
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
        <Button variant="secondary" className="ml-auto" onClick={exportXlsx} aria-label="Download XLSX">
          <Download />
          Download .xlsx
        </Button>
      </div>

      <div className="rounded-md border overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="px-3 py-2 text-left font-medium border-b relative select-none"
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
    </section>
  );
}

function hdr(label: string) {
  return () => <div className="font-medium">{label}</div>;
}

function numericCell<Key extends keyof MetricRow>(key: Key, medians: Partial<Record<keyof MetricRow, number>>) {
  return (info: any) => {
    const v = info.getValue() as number;
    const isMedian = medians[key] !== undefined && Math.abs((medians[key] as number) - v) < 1e-6;
    return (
      <span className={isMedian ? "bg-accent px-1 py-0.5 rounded" : undefined}>{numericFormatter(v)}</span>
    );
  };
}

function cellCls(cell: any) {
  return "px-3 py-2 border-b align-middle";
}
