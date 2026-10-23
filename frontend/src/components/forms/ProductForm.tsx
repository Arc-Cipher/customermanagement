import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { ProductRequest, ProductResponse } from '../../types/product';
import type { CategoryResponse } from '../../types/category';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(150, 'Name cannot exceed 150 characters'),
  barcode: z.string().trim().min(3, 'Barcode must be at least 3 characters').max(50, 'Barcode cannot exceed 50 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  stockQuantity: z.coerce.number().int().min(0, 'Initial stock cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(0, 'Threshold cannot be negative').default(10),
  categoryId: z.coerce.number().int().positive('Please select a valid category'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductFormProps {
  initialData?: ProductResponse | null;
  categories: CategoryResponse[];
  onSubmit: (data: ProductRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string> | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  serverErrors,
}) => {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      barcode: initialData?.barcode || '',
      price: initialData?.price || 0,
      stockQuantity: initialData?.stockQuantity || 0,
      lowStockThreshold: initialData?.lowStockThreshold ?? 10,
      categoryId: initialData?.categoryId || (categories.length > 0 ? categories[0].id : 0),
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        barcode: initialData.barcode,
        price: initialData.price,
        stockQuantity: initialData.stockQuantity,
        lowStockThreshold: initialData.lowStockThreshold,
        categoryId: initialData.categoryId,
      });
    } else if (categories.length > 0) {
      reset({
        name: '',
        barcode: '',
        price: 0,
        stockQuantity: 0,
        lowStockThreshold: 10,
        categoryId: categories[0].id,
      });
    }
  }, [initialData, categories, reset]);

  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([field, msg]) => {
        if (
          field === 'name' ||
          field === 'barcode' ||
          field === 'price' ||
          field === 'stockQuantity' ||
          field === 'lowStockThreshold' ||
          field === 'categoryId'
        ) {
          setError(field as keyof ProductFormValues, {
            type: 'server',
            message: msg,
          });
        }
      });
    }
  }, [serverErrors, setError]);

  const handleFormSubmit = async (values: ProductFormValues) => {
    const payload: ProductRequest = {
      name: values.name,
      barcode: values.barcode,
      price: values.price,
      stockQuantity: values.stockQuantity,
      lowStockThreshold: values.lowStockThreshold,
      categoryId: values.categoryId,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Product Name"
        placeholder="e.g. Basmati Rice 1kg"
        required
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Barcode / SKU"
        placeholder="e.g. 8901030383723"
        required
        {...register('barcode')}
        error={errors.barcode?.message}
      />

      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="categoryId"
          {...register('categoryId')}
          className={`block w-full rounded-lg border text-sm py-2 px-3 transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            errors.categoryId
              ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        >
          <option value={0} disabled>
            Select a category...
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId?.message && (
          <p className="mt-1 text-xs text-red-600 font-medium">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Unit Price (INR)"
          type="number"
          step="0.01"
          placeholder="0.00"
          required
          {...register('price')}
          error={errors.price?.message}
        />

        <Input
          label="Stock Quantity"
          type="number"
          step="1"
          placeholder="0"
          required
          disabled={!!initialData} // stock quantity edits on existing items typically use adjust stock
          helperText={initialData ? 'Use "Adjust Stock" to change current stock' : undefined}
          {...register('stockQuantity')}
          error={errors.stockQuantity?.message}
        />
      </div>

      <Input
        label="Low Stock Alert Threshold"
        type="number"
        step="1"
        placeholder="10"
        helperText="Items with stock at or below this level are marked with an alert"
        {...register('lowStockThreshold')}
        error={errors.lowStockThreshold?.message}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
