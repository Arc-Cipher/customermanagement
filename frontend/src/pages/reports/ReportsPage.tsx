import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  TrendingUp,
  AlertOctagon,
  Sliders,
  Phone,
} from 'lucide-react';
import { getTopCustomers, getTopProducts, getLowStockProducts } from '../../api/reports';
import { adjustStock } from '../../api/products';
import { formatINR } from '../../utils/currency';
import { useToast } from '../../hooks/useToast';
import type { TopCustomer, TopProduct } from '../../types/report';
import type { ProductResponse, StockAdjustRequest } from '../../types/product';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StockAdjustForm } from '../../components/forms/StockAdjustForm';

export const ReportsPage: React.FC = () => {
  const { success, handleApiError } = useToast();
  const queryClient = useQueryClient();

  const [customerLimit, setCustomerLimit] = useState(10);
  const [productLimit, setProductLimit] = useState(10);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<ProductResponse | null>(null);

  // Queries
  const { data: topCustomers = [], isLoading: topCustomersLoading } = useQuery({
    queryKey: ['reports', 'top-customers', customerLimit],
    queryFn: () => getTopCustomers(customerLimit),
  });

  const { data: topProducts = [], isLoading: topProductsLoading } = useQuery({
    queryKey: ['reports', 'top-products', productLimit],
    queryFn: () => getTopProducts(productLimit),
  });

  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => getLowStockProducts(),
  });

  // Stock adjust mutation
  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockAdjustRequest }) => adjustStock(id, data),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setStockAdjustProduct(null);
      success(`Restocked "${p.name}"! New stock: ${p.stockQuantity}`);
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to update stock');
    },
  });

  // Top Customers Columns
  const topCustomerColumns: Column<TopCustomer>[] = [
    {
      key: 'rank',
      header: '#',
      render: (_, idx) => (
        <span className="font-bold text-slate-400 text-xs">{idx + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <p className="font-bold text-slate-900">{c.name}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'purchaseCount',
      header: 'Orders',
      render: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
          {c.purchaseCount} visits
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (c) => (
        <span className="font-extrabold text-indigo-700">{formatINR(c.totalSpent)}</span>
      ),
    },
  ];

  // Top Products Columns
  const topProductColumns: Column<TopProduct>[] = [
    {
      key: 'rank',
      header: '#',
      render: (_, idx) => (
        <span className="font-bold text-slate-400 text-xs">{idx + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (p) => <span className="font-bold text-slate-900">{p.name}</span>,
    },
    {
      key: 'totalQuantitySold',
      header: 'Units Sold',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (p) => (
        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
          {p.totalQuantitySold} units
        </span>
      ),
    },
  ];

  // Low Stock Columns
  const lowStockColumns: Column<ProductResponse>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {p.barcode}</p>
        </div>
      ),
    },
    {
      key: 'categoryName',
      header: 'Category',
      render: (p) => <span className="text-xs text-slate-600">{p.categoryName}</span>,
    },
    {
      key: 'stockQuantity',
      header: 'Current Stock',
      render: (p) => (
        <div className="flex items-center gap-2">
          <span
            className={`font-mono font-extrabold text-sm ${
              p.stockQuantity === 0 ? 'text-red-600' : 'text-amber-600'
            }`}
          >
            {p.stockQuantity} units
          </span>
          <span className="text-xs text-slate-400">
            (alert &le; {p.lowStockThreshold})
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => <span className="font-medium text-slate-700">{formatINR(p.price)}</span>,
    },
    {
      key: 'actions',
      header: 'Restock',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (p) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStockAdjustProduct(p)}
          leftIcon={<Sliders className="w-3.5 h-3.5" />}
        >
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Store Analytics & Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time metrics on customer lifetime spend, top-selling inventory, and supply warnings
        </p>
      </div>

      {/* Row 1: Top Customers & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Top Customers by Spend</span>
            </div>
          }
          subtitle="Highest spending loyalty members"
          action={
            <select
              value={customerLimit}
              onChange={(e) => setCustomerLimit(parseInt(e.target.value, 10))}
              className="text-xs font-semibold rounded-lg border border-gray-300 py-1 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          }
          bodyClassName="p-0"
        >
          <Table<TopCustomer>
            columns={topCustomerColumns}
            data={topCustomers}
            keyExtractor={(c) => c.customerId}
            isLoading={topCustomersLoading}
            emptyMessage="No customer sales data available"
          />
        </Card>

        {/* Top Products Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Best Selling Products</span>
            </div>
          }
          subtitle="Highest sales volume items"
          action={
            <select
              value={productLimit}
              onChange={(e) => setProductLimit(parseInt(e.target.value, 10))}
              className="text-xs font-semibold rounded-lg border border-gray-300 py-1 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          }
          bodyClassName="p-0"
        >
          <Table<TopProduct>
            columns={topProductColumns}
            data={topProducts}
            keyExtractor={(p) => p.productId}
            isLoading={topProductsLoading}
            emptyMessage="No sales volume recorded yet"
          />
        </Card>
      </div>

      {/* Row 2: Low Stock Warning Card */}
      <Card
        title={
          <div className="flex items-center gap-2 text-rose-700">
            <AlertOctagon className="w-5 h-5" />
            <span className="text-slate-900">Low Stock & Inventory Alerts</span>
          </div>
        }
        subtitle="Items currently at or below their configured reorder threshold"
        action={
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {lowStockProducts.length} items flagged
          </span>
        }
        bodyClassName="p-0"
      >
        <Table<ProductResponse>
          columns={lowStockColumns}
          data={lowStockProducts}
          keyExtractor={(p) => p.id}
          isLoading={lowStockLoading}
          rowClassName={(p) =>
            p.stockQuantity === 0 ? 'bg-red-50/60' : 'bg-amber-50/40'
          }
          emptyMessage="All products have healthy inventory levels! No low stock alerts."
        />
      </Card>

      {/* ================= RESTOCK MODAL ================= */}
      <Modal
        isOpen={!!stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        title="Quick Stock Adjustment"
      >
        {stockAdjustProduct && (
          <StockAdjustForm
            product={stockAdjustProduct}
            onSubmit={async (data) => {
              await adjustStockMutation.mutateAsync({ id: stockAdjustProduct.id, data });
            }}
            onCancel={() => setStockAdjustProduct(null)}
            isLoading={adjustStockMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
};

export default ReportsPage;
