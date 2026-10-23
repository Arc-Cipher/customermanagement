import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CategoryRequest, CategoryResponse } from '../../types/category';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Cannot exceed 50 characters'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategoryFormProps {
  initialData?: CategoryResponse | null;
  onSubmit: (data: CategoryRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string> | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({ name: initialData.name });
    } else {
      reset({ name: '' });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (serverErrors && serverErrors.name) {
      setError('name', { type: 'server', message: serverErrors.name });
    }
  }, [serverErrors, setError]);

  const handleFormSubmit = async (values: CategoryFormValues) => {
    await onSubmit({ name: values.name.trim() });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Category Name"
        placeholder="e.g. Dairy & Eggs, Snacks, Beverages"
        required
        {...register('name')}
        error={errors.name?.message}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
