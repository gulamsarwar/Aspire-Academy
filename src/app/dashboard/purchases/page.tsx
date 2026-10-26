'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

export default function PurchaseHistoryPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user.id)}`);
        if (!res.ok) throw new Error('Failed to load orders');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load student orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user?.id]);

  const orders = data?.orders || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Purchase & Order History
        </h1>
        <p className="text-xs text-slate-500">
          Receipts and transaction references for your verified course enrollments.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#046BD2] animate-spin" />
        </div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Course & Batch</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Transaction Ref</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {order.id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">
                          {order.course?.title || order.course_id || 'Enrolled Course'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {order.batch?.name || order.batch_id || 'Batch Assigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 text-sm">
                        ₹{(order.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Paid & Verified
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
                        {order.gateway_payment_id || order.gateway_order_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Purchase Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you enroll in a course via our UPI checkout, your verified receipt and
            order status will be visible here.
          </p>
        </div>
      )}
    </div>
  );
}
