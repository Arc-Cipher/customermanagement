import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { CustomerRequest, CustomerResponse } from '../../types/customer';

const phoneRegex = /^[6-9][0-9]{9}$/;

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Phone number must be a valid 10-digit Indian mobile number (starts with 6-9)'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(255, 'Address cannot exceed 255 characters').optional().or(z.literal('')),
  marketingConsent: z.boolean().default(false),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export interface CustomerFormProps {
  initialData?: CustomerResponse | null;
  onSubmit: (data: CustomerRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string> | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
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
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      marketingConsent: initialData?.marketingConsent ?? false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        phone: initialData.phone,
        email: initialData.email || '',
        address: initialData.address || '',
        marketingConsent: initialData.marketingConsent,
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([field, msg]) => {
        if (field === 'name' || field === 'phone' || field === 'email' || field === 'address') {
          setError(field as keyof CustomerFormValues, {
            type: 'server',
            message: msg,
          });
        }
      });
    }
  }, [serverErrors, setError]);

  const handleFormSubmit = async (values: CustomerFormValues) => {
    const payload: CustomerRequest = {
      name: values.name,
      phone: values.phone,
      email: values.email?.trim() ? values.email.trim() : undefined,
      address: values.address?.trim() ? values.address.trim() : undefined,
      marketingConsent: values.marketingConsent,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="e.g. Rahul Sharma"
        required
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Phone Number"
        placeholder="10-digit mobile number, e.g. 9876543210"
        required
        maxLength={10}
        {...register('phone')}
        error={errors.phone?.message}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="e.g. rahul@example.com (optional)"
        {...register('email')}
        error={errors.email?.message}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Address (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Street, City, Pin code"
          {...register('address')}
          className={`block w-full rounded-lg border text-sm p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            errors.address
              ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {errors.address?.message && (
          <p className="mt-1 text-xs text-red-600 font-medium">{errors.address.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          id="marketingConsent"
          type="checkbox"
          {...register('marketingConsent')}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="marketingConsent" className="text-sm text-slate-700 select-none">
          Customer agrees to receive promotional SMS & promotional updates
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
