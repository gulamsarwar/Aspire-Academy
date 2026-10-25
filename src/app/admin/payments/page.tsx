'use client';

import React, { useState } from 'react';
import { db } from '@/lib/data/mock-db';
import { Order } from '@/lib/types';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([...db.orders]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'created' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.gateway_order_id.toLowerCase().includes(search.toLowerCase()) ||
      (o.gateway_payment_id && o.gateway_payment_id.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const totalCollected = orders
    .filter((o) => o.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Orders & Payment Management
          </h1>
          <p className="text-xs text-slate-500">
            Audit Razorpay transaction references, inspect UPI payments, and verify reconciliation.
          </p>
        </div>

        {/* Export CSV action */}
        <button
          onClick={() => {
            const rows = [
              ['Order ID', 'Course ID', 'Amount', 'Status', 'Gateway Ref', 'Date'],
              ...filteredOrders.map((o) => [
                o.id,
                o.course_id,
                o.amount,
                o.status,
                o.gateway_payment_id || o.gateway_order_id,
                o.created_at,
              ]),
            ];
            const csv = rows.map((r) => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-export-${Date.now()}.csv`;
            a.click();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue Verified
          </span>
          <span className="text-2xl font-black text-[#046BD2] block">
            ₹{totalCollected.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">
            Razorpay Merchant Settlement
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Successful Orders
          </span>
          <span className="text-2xl font-black text-emerald-700 block">
            {orders.filter((o) => o.status === 'paid').length}
          </span>
          <span className="text-[10px] text-slate-400">100% automated enrollment</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending / Incomplete
          </span>
          <span className="text-2xl font-black text-amber-700 block">
            {orders.filter((o) => o.status === 'created').length}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold">Awaiting payment event</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order ID or Gateway Payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2] bg-slate-50"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto">
          {(['all', 'paid', 'created', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Internal Order ID</th>
                <th className="px-6 py-4">Course & Batch</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Razorpay Reference</th>
                <th className="px-6 py-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const course = db.getCourseById(order.course_id);
                const batch = db.getBatchById(order.batch_id);

                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {order.id}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">
                        {course?.title}
                      </span>
                      <span className="text-[11px] text-slate-500">{batch?.name}</span>
                    </td>

                    <td className="px-6 py-4 font-black text-slate-900 text-sm">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-6 py-4">
                      {order.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Verified & Paid
                        </span>
                      ) : order.status === 'created' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Payment ID:</span>
                        <span className="font-bold">
                          {order.gateway_payment_id || 'N/A (Pending)'}
                        </span>
                      </div>
                      <div className="pt-0.5">
                        <span className="text-[10px] text-slate-400 block">Order ID:</span>
                        <span>{order.gateway_order_id}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
