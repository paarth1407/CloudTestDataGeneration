"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface DataTableProps {
  data: Record<string, any>[] | null
}

const ROWS_PER_PAGE = 20;

export function DataTable({ data }: DataTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset to page 1 if data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">No data to display.</p>
        </div>
    )
  }

  const headers = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
      <ScrollArea className="border rounded-lg max-h-[60vh]">
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-bold">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={startIndex + rowIndex}>
                {headers.map((header) => (
                  <TableCell key={`${startIndex + rowIndex}-${header}`} className="font-mono text-sm">
                    {String(row[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Showing <span className="font-semibold">{startIndex + 1}</span>-<span className="font-semibold">{Math.min(endIndex, data.length)}</span> of{' '}<span className="font-semibold">{data.length}</span> rows.
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
      )}
    </div>
  )
}
