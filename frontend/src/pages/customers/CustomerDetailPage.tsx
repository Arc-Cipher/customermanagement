import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Receipt,
  Eye,
  CheckCircle2,
  XCircle,
  Printer,
} from 'lucide-react';
import { getCustomerById } from '../../api/customers';
import { listPurchasesByCustomer, getPurchaseById } from '../../api/purchases';
import { formatINR } from '../../utils/currency';
import type { PurchaseResponse } from '../../types/purchase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id || '', 10);
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseResponse | null>(null);

  // Fetch customer details
  const {
    data: customer,
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomerById(customerId),
    enabled: !isNaN(customerId),
  });

  // Fetch customer purchase history
  const {
    data: purchasesData,
    isLoading: purchasesLoading,
  } = useQuery({
    queryKey: ['customer-purchases', customerId, page, pageSize],
    queryFn: () => listPurchasesByCustomer(customerId, { page, size: pageSize }),
    enabled: !isNaN(customerId),
  });

  const handleViewReceipt = async (purchaseId: number) => {
    try {
      const details = await getPurchaseById(purchaseId);
      setSelectedPurchase(details);
    } catch {
      // fallback
    }
  };

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Customer Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          The requested customer profile could not be located or may have been removed.
        </p>
        <Button variant="secondary" onClick={() => navigate('/customers')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const purchaseColumns: Column<PurchaseResponse>[] = [
    {
      key: 'id',
      header: 'Invoice #',
      render: (p) => <span className="font-mono font-bold text-slate-800">INV-{p.id}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (p) => (
        <span className="text-xs text-slate-600">
          {new Date(p.createdAt).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'cashierName',
      header: 'Billed By',
      render: (p) => <span className="text-sm text-slate-700">{p.cashierName || 'Staff'}</span>,
    },
    {
      key: 'itemsCount',
      header: 'Items',
      render: (p) => (
        <span className="text-xs text-slate-600">
          {p.items.reduce((sum, item) => sum + item.quantity, 0)} items ({p.items.length} unique)
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Paid Amount',
      render: (p) => (
        <div>
          <span className="font-bold text-slate-900">{formatINR(p.totalAmount)}</span>
          {p.discount > 0 && (
            <p className="text-[11px] text-emerald-600 font-medium">-{formatINR(p.discount)} discount</p>
          )}
        </div>
      ),
    },
    {
      key: 'loyalty',
      header: 'Loyalty Impact',
      render: (p) => (
        <div className="text-xs font-mono">
          <span className="text-indigo-600 font-semibold">+{p.pointsEarned} earned</span>
          {p.pointsRedeemed > 0 && (
            <span className="text-rose-600 block">-{p.pointsRedeemed} redeemed</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Receipt',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (p) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewReceipt(p.id)}
          className="text-indigo-600 hover:text-indigo-900"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customers')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-slate-600 hover:text-slate-900"
        >
          Back to Customer Directory
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{customer.name}</span>
                <Badge variant={customer.status === 'ACTIVE' ? 'active' : 'inactive'}>
                  {customer.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-normal">Customer ID #{customer.id}</p>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Phone Number</p>
              <p className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                {customer.phone}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Email Address</p>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {customer.email || 'Not provided'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Loyalty Balance</p>
              <p className="text-lg font-black text-indigo-600 mt-0.5">
                {customer.loyaltyPoints} Points
              </p>
              <p className="text-xs text-slate-500">Worth {formatINR(customer.loyaltyPoints)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Registered</p>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {new Date(customer.createdAt).toLocaleDateString('en-IN')}
              </p>
              <p className="text-xs text-slate-400">By {customer.createdByName}</p>
            </div>
          </div>
        </div>

        {/* Extra customer details */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>
              Address: <strong>{customer.address || 'No address registered'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {customer.marketingConsent ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Subscribed to Marketing SMS
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 font-medium">
                <XCircle className="w-4 h-4 text-slate-400" />
                Opted out of Marketing
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Purchase History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Purchase History</h2>
          </div>
          {purchasesData && (
            <span className="text-xs text-slate-500 font-medium">
              Total {purchasesData.totalElements} purchases
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table<PurchaseResponse>
            columns={purchaseColumns}
            data={purchasesData?.content || []}
            keyExtractor={(p) => p.id}
            isLoading={purchasesLoading}
            emptyMessage="No purchases recorded yet for this customer"
          />

          {purchasesData && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Page {purchasesData.page + 1} of {Math.max(1, purchasesData.totalPages)}
              </p>

              <Pagination
                page={purchasesData.page}
                totalPages={purchasesData.totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= RECEIPT VIEW MODAL ================= */}
      <Modal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        size="lg"
        title={
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Receipt Details #{selectedPurchase?.id}</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Receipt
            </Button>
            <Button variant="primary" onClick={() => setSelectedPurchase(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedPurchase && (
          <div id="printable-receipt" className="p-4 sm:p-6 bg-white font-mono text-xs sm:text-sm text-slate-800">
            <div className="text-center pb-4 border-b border-dashed border-gray-300">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-sans">
                SUPERMART SUPERMARKET
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Premium Groceries & Daily Needs &bull; Bengaluru, India
              </p>
            </div>

            <div className="py-3 border-b border-dashed border-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-bold">INV-{selectedPurchase.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(selectedPurchase.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{selectedPurchase.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{selectedPurchase.customerName || customer.name}</span>
              </div>
            </div>

            <div className="py-3 border-b border-dashed border-gray-300">
              <div className="grid grid-cols-12 font-bold pb-2 border-b border-gray-200">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="divide-y divide-gray-100 py-1">
                {selectedPurchase.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1.5">
                    <span className="col-span-6 truncate font-sans font-medium">
                      {item.productName}
                    </span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right">{formatINR(item.unitPrice)}</span>
                    <span className="col-span-2 text-right font-bold">{formatINR(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-3 border-b border-dashed border-gray-300 space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(selectedPurchase.subtotal)}</span>
              </div>
              {selectedPurchase.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Points Redeemed ({selectedPurchase.pointsRedeemed} pts):</span>
                  <span>-{formatINR(selectedPurchase.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-gray-300">
                <span>Grand Total:</span>
                <span>{formatINR(selectedPurchase.totalAmount)}</span>
              </div>
            </div>

            <div className="py-3 bg-slate-50/80 p-2.5 rounded my-2">
              <div className="flex justify-between text-xs">
                <span>Loyalty Points Earned:</span>
                <span className="font-bold text-indigo-700">+{selectedPurchase.pointsEarned} pts</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerDetailPage;
