import React from 'react';
import { clsx } from '../../services/utils';

interface DataTableProps {
  columns: { key: string; label: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, onRowClick, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage || 'No data found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'transition-colors',
                onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              )}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] as React.ReactNode) || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
