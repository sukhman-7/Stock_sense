'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export default function DashboardFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const type = searchParams.get('type') || 'All Types';
  const status = searchParams.get('status') || 'All Statuses';

  const handleFilterChange = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'All Types' || value === 'All Statuses') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [router, searchParams, pathname]);

  return (
    <div className="flex items-center space-x-4 mb-6 bg-white p-4 shadow rounded-lg">
      <div>
        <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">Document Type</label>
        <select
          id="type-filter"
          value={type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="All Types">All Types</option>
          <option value="Receipts">Receipts</option>
          <option value="Deliveries">Deliveries</option>
        </select>
      </div>

      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Waiting">Waiting</option>
          <option value="Ready">Ready</option>
          <option value="Done">Done</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
}
