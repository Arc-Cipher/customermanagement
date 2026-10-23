import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { StaffRequest } from '../../types/staff';
import type { Role } from '../../types/auth';

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain alphanumeric characters, dots, underscores and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
  role: z.enum(['CASHIER', 'MANAGER', 'ADMIN'] as const, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export interface StaffFormProps {
  onSubmit: (data: StaffRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string> | null;
}

export const StaffForm: React.FC<StaffFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  serverErrors,
}) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      role: 'CASHIER' as Role,
    },
  });

  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([field, msg]) => {
        if (field === 'name' || field === 'username' || field === 'password' || field === 'role') {
          setError(field as keyof StaffFormValues, {
            type: 'server',
            message: msg,
          });
        }
      });
    }
  }, [serverErrors, setError]);

  const handleFormSubmit = async (values: StaffFormValues) => {
    await onSubmit({
      name: values.name.trim(),
      username: values.username.trim(),
      password: values.password,
      role: values.role,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="e.g. Priya Patel"
        required
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Username"
        placeholder="e.g. priya_p"
        required
        autoComplete="off"
        {...register('username')}
        error={errors.username?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        required
        autoComplete="new-password"
        {...register('password')}
        error={errors.password?.message}
      />

      <div>
        <label htmlFor="staffRole" className="block text-sm font-medium text-slate-700 mb-1">
          Store Role <span className="text-red-500">*</span>
        </label>
        <select
          id="staffRole"
          {...register('role')}
          className={`block w-full rounded-lg border text-sm py-2 px-3 transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            errors.role
              ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        >
          <option value="CASHIER">CASHIER (Point of sale billing, search customers)</option>
          <option value="MANAGER">MANAGER (Inventory, category, customer edits, reports)</option>
          <option value="ADMIN">ADMIN (Full access including staff administration)</option>
        </select>
        {errors.role?.message && (
          <p className="mt-1 text-xs text-red-600 font-medium">{errors.role.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Create Staff Member
        </Button>
      </div>
    </form>
  );
};

export default StaffForm;
