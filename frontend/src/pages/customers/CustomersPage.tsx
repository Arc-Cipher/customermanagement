import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  Phone,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { canManage } from '../../utils/roleUtils';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  reactivateCustomer,
} from '../../api/customers';
import type { CustomerResponse, CustomerRequest, CustomerStatus } from '../../types/customer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { extractFieldErrors } from '../../hooks/useToast';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const { success, handleApiError } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isManagerOrAdmin = canManage(user?.role);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus>('ACTIVE');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponse | null>(null);
  const [deactivatingCustomer, setDeactivatingCustomer] = useState<CustomerResponse | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string> | null>(null);

  // Fetch customers
  const {
    data: customerData,
    isLoading,
    isPlaceholderData,
  } = useQuery({
    queryKey: ['customers', debouncedSearch, statusFilter, page, pageSize],
    queryFn: () =>
      listCustomers({
        q: debouncedSearch.trim() || undefined,
        status: statusFilter,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CustomerRequest) => createCustomer(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddModalOpen(false);
      setServerErrors(null);
      success(`Customer ${created.name} created successfully!`);
    },
    onError: (err: unknown) => {
      setServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to create customer');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerRequest }) => updateCustomer(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingCustomer(null);
      setServerErrors(null);
      success(`Customer ${updated.name} updated successfully!`);
    },
    onError: (err: unknown) => {
      setServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to update customer');
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeactivatingCustomer(null);
      success('Customer deactivated successfully');
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to deactivate customer');
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: (id: number) => reactivateCustomer(id),
    onSuccess: (reactivated) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success(`Customer ${reactivated.name} reactivated!`);
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to reactivate customer');
    },
  });

  // Columns definition
  const columns: Column<CustomerResponse>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div>
          <button
            type="button"
            onClick={() => navigate(`/customers/${c.id}`)}
            className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left block"
          >
            {c.name}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="font-mono">{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / Address',
      render: (c) => (
        <div className="max-w-xs truncate">
          {c.email ? (
            <div className="flex items-center gap-1 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{c.email}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs italic">No email</span>
          )}
          {c.address && <p className="text-xs text-slate-400 truncate mt-0.5">{c.address}</p>}
        </div>
      ),
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty Points',
      render: (c) => (
        <div className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
          {c.loyaltyPoints} pts
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={c.status === 'ACTIVE' ? 'active' : 'inactive'}>
          {c.status}
        </Badge>
      ),
    },
    {
      key: 'createdByName',
      header: 'Enrolled By',
      render: (c) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium text-slate-800">{c.createdByName}</p>
          <p className="text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/customers/${c.id}`)}
            title="View full history"
            className="p-1.5"
          >
            <Eye className="w-4 h-4 text-slate-600" />
          </Button>

          {isManagerOrAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setServerErrors(null);
                  setEditingCustomer(c);
                }}
                title="Edit customer"
                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>

              {c.status === 'ACTIVE' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeactivatingCustomer(c)}
                  title="Deactivate customer"
                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reactivateMutation.mutate(c.id)}
                  title="Reactivate customer"
                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                  isLoading={reactivateMutation.isPending}
                >
                  <UserCheck className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search loyalty members, register new customers, and review records
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setServerErrors(null);
            setIsAddModalOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by name or mobile number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            leftAddon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Status Tab buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-stretch sm:self-auto">
          {(['ACTIVE', 'INACTIVE'] as CustomerStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(0);
              }}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table<CustomerResponse>
          columns={columns}
          data={customerData?.content || []}
          keyExtractor={(c) => c.id}
          isLoading={isLoading}
          emptyMessage="No customers found matching your criteria"
        />

        {/* Pagination Footer */}
        {customerData && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <strong className="text-slate-700">
                {customerData.content.length > 0 ? customerData.page * customerData.size + 1 : 0}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-700">
                {customerData.page * customerData.size + customerData.content.length}
              </strong>{' '}
              of <strong className="text-slate-700">{customerData.totalElements}</strong> customers
            </p>

            <Pagination
              page={customerData.page}
              totalPages={customerData.totalPages}
              onPageChange={(newPage) => {
                if (!isPlaceholderData) {
                  setPage(newPage);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* ================= ADD CUSTOMER MODAL ================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
      >
        <CustomerForm
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          onCancel={() => setIsAddModalOpen(false)}
          isLoading={createMutation.isPending}
          serverErrors={serverErrors}
        />
      </Modal>

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      <Modal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        title={`Edit Customer: ${editingCustomer?.name || ''}`}
      >
        {editingCustomer && (
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id: editingCustomer.id, data });
            }}
            onCancel={() => setEditingCustomer(null)}
            isLoading={updateMutation.isPending}
            serverErrors={serverErrors}
          />
        )}
      </Modal>

      {/* ================= DEACTIVATE CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={!!deactivatingCustomer}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate customer "${deactivatingCustomer?.name}" (${deactivatingCustomer?.phone})? Inactive customers cannot make purchases or redeem loyalty points.`}
        confirmLabel="Deactivate Customer"
        onConfirm={() => {
          if (deactivatingCustomer) {
            deactivateMutation.mutate(deactivatingCustomer.id);
          }
        }}
        onCancel={() => setDeactivatingCustomer(null)}
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
};

export default CustomersPage;
