import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Sliders,
  Trash2,
  Tags,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast, extractFieldErrors } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { canManage } from '../../utils/roleUtils';
import { formatINR } from '../../utils/currency';
import {
  listProducts,
  createProduct,
  updateProduct,
  adjustStock,
  deactivateProduct,
} from '../../api/products';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/categories';
import type { ProductResponse, ProductRequest, StockAdjustRequest } from '../../types/product';
import type { CategoryResponse, CategoryRequest } from '../../types/category';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { ProductForm } from '../../components/forms/ProductForm';
import { StockAdjustForm } from '../../components/forms/StockAdjustForm';
import { CategoryForm } from '../../components/forms/CategoryForm';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, handleApiError } = useToast();
  const queryClient = useQueryClient();
  const isManagerOrAdmin = canManage(user?.role);

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Product Filters & Pagination
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [productPage, setProductPage] = useState(0);
  const pageSize = 15;

  // Product Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<ProductResponse | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = useState<ProductResponse | null>(null);
  const [productServerErrors, setProductServerErrors] = useState<Record<string, string> | null>(null);

  // Category Modals
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [categoryServerErrors, setCategoryServerErrors] = useState<Record<string, string> | null>(null);

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  });

  const { data: productsData, isLoading: productsLoading, isPlaceholderData } = useQuery({
    queryKey: ['products', debouncedProductSearch, selectedCategoryId, productPage, pageSize],
    queryFn: () =>
      listProducts({
        q: debouncedProductSearch.trim() || undefined,
        categoryId: selectedCategoryId,
        page: productPage,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  // Product Mutations
  const createProductMutation = useMutation({
    mutationFn: (data: ProductRequest) => createProduct(data),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddProductOpen(false);
      setProductServerErrors(null);
      success(`Product "${p.name}" added successfully!`);
    },
    onError: (err: unknown) => {
      setProductServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to create product');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductRequest }) => updateProduct(id, data),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      setProductServerErrors(null);
      success(`Product "${p.name}" updated!`);
    },
    onError: (err: unknown) => {
      setProductServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to update product');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockAdjustRequest }) => adjustStock(id, data),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setStockAdjustProduct(null);
      success(`Stock for "${p.name}" updated to ${p.stockQuantity} units!`);
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to adjust stock');
    },
  });

  const deactivateProductMutation = useMutation({
    mutationFn: (id: number) => deactivateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeactivatingProduct(null);
      success('Product deactivated successfully');
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to deactivate product');
    },
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryRequest) => createCategory(data),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddCategoryOpen(false);
      setCategoryServerErrors(null);
      success(`Category "${cat.name}" created!`);
    },
    onError: (err: unknown) => {
      setCategoryServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to create category');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryRequest }) => updateCategory(id, data),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingCategory(null);
      setCategoryServerErrors(null);
      success(`Category renamed to "${cat.name}"!`);
    },
    onError: (err: unknown) => {
      setCategoryServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to update category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeletingCategory(null);
      success('Category removed successfully');
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Cannot delete category (it may still have linked products)');
    },
  });

  // Product Columns
  const productColumns: Column<ProductResponse>[] = [
    {
      key: 'name',
      header: 'Product Name',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Barcode: {p.barcode}</p>
        </div>
      ),
    },
    {
      key: 'categoryName',
      header: 'Category',
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
          <Tags className="w-3 h-3 text-slate-400" />
          {p.categoryName}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price (INR)',
      render: (p) => <span className="font-bold text-slate-900">{formatINR(p.price)}</span>,
    },
    {
      key: 'stockQuantity',
      header: 'Stock Level',
      render: (p) => {
        const isLow = p.stockQuantity <= p.lowStockThreshold;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono font-bold text-sm ${
                isLow ? 'text-amber-600' : 'text-slate-800'
              }`}
            >
              {p.stockQuantity}
            </span>
            {isLow && (
              <Badge variant="lowStock" className="text-[10px] py-0 px-1.5">
                Low (&le; {p.lowStockThreshold})
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'active',
      header: 'Status',
      render: (p) => (
        <Badge variant={p.active ? 'active' : 'inactive'}>
          {p.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {isManagerOrAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStockAdjustProduct(p)}
                title="Adjust stock quantity"
                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                <Sliders className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setProductServerErrors(null);
                  setEditingProduct(p);
                }}
                title="Edit product"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              {p.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeactivatingProduct(p)}
                  title="Deactivate product"
                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  // Category Columns
  const categoryColumns: Column<CategoryResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (c) => <span className="font-mono text-xs text-slate-500">#{c.id}</span>,
    },
    {
      key: 'name',
      header: 'Category Name',
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Tags className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">{c.name}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {isManagerOrAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryServerErrors(null);
                  setEditingCategory(c);
                }}
                title="Rename category"
                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingCategory(c)}
                title="Delete category"
                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Inventory & Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage inventory stock levels, barcode details, pricing, and product categories
          </p>
        </div>

        {/* Action Button depending on tab */}
        {isManagerOrAdmin && (
          <div className="flex items-center gap-3">
            {activeTab === 'products' ? (
              <Button
                variant="primary"
                onClick={() => {
                  setProductServerErrors(null);
                  setIsAddProductOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Product
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setCategoryServerErrors(null);
                  setIsAddCategoryOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Category
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
            {productsData && (
              <span className="ml-1.5 bg-slate-100 text-slate-700 text-xs py-0.5 px-2 rounded-full font-bold">
                {productsData.totalElements}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Categories</span>
            <span className="ml-1.5 bg-slate-100 text-slate-700 text-xs py-0.5 px-2 rounded-full font-bold">
              {categories.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ================= TAB 1: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:max-w-md">
              <Input
                placeholder="Search products by name or barcode..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(0);
                }}
                leftAddon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Category Dropdown Filter */}
            <div className="w-full sm:w-64">
              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setSelectedCategoryId(val);
                  setProductPage(0);
                }}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table<ProductResponse>
              columns={productColumns}
              data={productsData?.content || []}
              keyExtractor={(p) => p.id}
              isLoading={productsLoading}
              rowClassName={(p) =>
                p.stockQuantity <= p.lowStockThreshold ? 'bg-amber-50/50 hover:bg-amber-50' : ''
              }
              emptyMessage="No products match your search or filter"
            />

            {/* Pagination */}
            {productsData && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Showing{' '}
                  <strong className="text-slate-700">
                    {productsData.content.length > 0 ? productsData.page * productsData.size + 1 : 0}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-700">
                    {productsData.page * productsData.size + productsData.content.length}
                  </strong>{' '}
                  of <strong className="text-slate-700">{productsData.totalElements}</strong> products
                </p>

                <Pagination
                  page={productsData.page}
                  totalPages={productsData.totalPages}
                  onPageChange={(newPage) => {
                    if (!isPlaceholderData) {
                      setProductPage(newPage);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table<CategoryResponse>
              columns={categoryColumns}
              data={categories}
              keyExtractor={(c) => c.id}
              isLoading={categoriesLoading}
              emptyMessage="No categories defined yet"
            />
          </div>
        </div>
      )}

      {/* ================= ADD PRODUCT MODAL ================= */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Add New Product to Inventory"
      >
        <ProductForm
          categories={categories}
          onSubmit={async (data) => {
            await createProductMutation.mutateAsync(data);
          }}
          onCancel={() => setIsAddProductOpen(false)}
          isLoading={createProductMutation.isPending}
          serverErrors={productServerErrors}
        />
      </Modal>

      {/* ================= EDIT PRODUCT MODAL ================= */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit Product: ${editingProduct?.name || ''}`}
      >
        {editingProduct && (
          <ProductForm
            initialData={editingProduct}
            categories={categories}
            onSubmit={async (data) => {
              await updateProductMutation.mutateAsync({ id: editingProduct.id, data });
            }}
            onCancel={() => setEditingProduct(null)}
            isLoading={updateProductMutation.isPending}
            serverErrors={productServerErrors}
          />
        )}
      </Modal>

      {/* ================= STOCK ADJUST MODAL ================= */}
      <Modal
        isOpen={!!stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        title="Adjust Inventory Stock Level"
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

      {/* ================= DEACTIVATE PRODUCT CONFIRM ================= */}
      <ConfirmDialog
        isOpen={!!deactivatingProduct}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${deactivatingProduct?.name}" (${deactivatingProduct?.barcode})? Cashiers will not be able to ring up this product in the POS.`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (deactivatingProduct) {
            deactivateProductMutation.mutate(deactivatingProduct.id);
          }
        }}
        onCancel={() => setDeactivatingProduct(null)}
        isLoading={deactivateProductMutation.isPending}
      />

      {/* ================= ADD CATEGORY MODAL ================= */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="Add New Product Category"
      >
        <CategoryForm
          onSubmit={async (data) => {
            await createCategoryMutation.mutateAsync(data);
          }}
          onCancel={() => setIsAddCategoryOpen(false)}
          isLoading={createCategoryMutation.isPending}
          serverErrors={categoryServerErrors}
        />
      </Modal>

      {/* ================= EDIT CATEGORY MODAL ================= */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={`Rename Category: ${editingCategory?.name || ''}`}
      >
        {editingCategory && (
          <CategoryForm
            initialData={editingCategory}
            onSubmit={async (data) => {
              await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data });
            }}
            onCancel={() => setEditingCategory(null)}
            isLoading={updateCategoryMutation.isPending}
            serverErrors={categoryServerErrors}
          />
        )}
      </Modal>

      {/* ================= DELETE CATEGORY CONFIRM ================= */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        title="Delete Category"
        message={
          <div className="space-y-2">
            <p>
              Are you sure you want to delete category &ldquo;{deletingCategory?.name}&rdquo;?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-center gap-1.5 border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Categories with existing products cannot be deleted.
            </p>
          </div>
        }
        confirmLabel="Delete Category"
        onConfirm={() => {
          if (deletingCategory) {
            deleteCategoryMutation.mutate(deletingCategory.id);
          }
        }}
        onCancel={() => setDeletingCategory(null)}
        isLoading={deleteCategoryMutation.isPending}
      />
    </div>
  );
};

export default ProductsPage;
