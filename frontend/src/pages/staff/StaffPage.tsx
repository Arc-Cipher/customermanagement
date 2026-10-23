import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast, extractFieldErrors } from '../../hooks/useToast';
import { listStaff, createStaff, activateStaff, deactivateStaff } from '../../api/staff';
import type { StaffResponse, StaffRequest } from '../../types/staff';
import { Button } from '../../components/ui/Button';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StaffForm } from '../../components/forms/StaffForm';

export const StaffPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, handleApiError } = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffToDeactivate, setStaffToDeactivate] = useState<StaffResponse | null>(null);
  const [staffToActivate, setStaffToActivate] = useState<StaffResponse | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string> | null>(null);

  // Query staff
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => listStaff(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: StaffRequest) => createStaff(data),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsAddStaffOpen(false);
      setServerErrors(null);
      success(`Staff member "${s.name}" added successfully!`);
    },
    onError: (err: unknown) => {
      setServerErrors(extractFieldErrors(err));
      handleApiError(err, 'Failed to create staff member');
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (id: number) => activateStaff(id),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setStaffToActivate(null);
      success(`Staff member "${s.name}" has been activated.`);
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to activate staff member');
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateStaff(id),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setStaffToDeactivate(null);
      success(`Staff member "${s.name}" has been deactivated.`);
    },
    onError: (err: unknown) => {
      handleApiError(err, 'Failed to deactivate staff member');
    },
  });

  const columns: Column<StaffResponse>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900">{s.name}</span>
              {currentUser?.id === s.id && (
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-mono">@{s.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (s) => {
        const badgeVariant =
          s.role === 'ADMIN' ? 'admin' : s.role === 'MANAGER' ? 'manager' : 'cashier';
        return (
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-400" />
            <Badge variant={badgeVariant} className="uppercase font-semibold">
              {s.role}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'active',
      header: 'Status',
      render: (s) => (
        <Badge variant={s.active ? 'active' : 'inactive'}>
          {s.active ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (s) => {
        const isSelf = currentUser?.id === s.id || currentUser?.username === s.username;

        return (
          <div className="flex items-center justify-end gap-2">
            {s.active ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isSelf}
                title={isSelf ? 'Cannot deactivate your own account' : 'Deactivate staff account'}
                onClick={() => setStaffToDeactivate(s)}
                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs"
                leftIcon={<UserX className="w-3.5 h-3.5" />}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStaffToActivate(s)}
                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 text-xs"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              >
                Activate
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Staff Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure system operator accounts and assign POS roles (Cashier, Manager, Admin)
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setServerErrors(null);
            setIsAddStaffOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table<StaffResponse>
          columns={columns}
          data={staffList}
          keyExtractor={(s) => s.id}
          isLoading={isLoading}
          emptyMessage="No staff records found"
        />
      </div>

      {/* ================= ADD STAFF MODAL ================= */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Add New Staff Member"
      >
        <StaffForm
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          onCancel={() => setIsAddStaffOpen(false)}
          isLoading={createMutation.isPending}
          serverErrors={serverErrors}
        />
      </Modal>

      {/* ================= DEACTIVATE STAFF CONFIRM ================= */}
      <ConfirmDialog
        isOpen={!!staffToDeactivate}
        title="Deactivate Staff Account"
        message={`Are you sure you want to deactivate ${staffToDeactivate?.name} (@${staffToDeactivate?.username})? They will immediately lose access to the system.`}
        confirmLabel="Deactivate Account"
        onConfirm={() => {
          if (staffToDeactivate) {
            deactivateMutation.mutate(staffToDeactivate.id);
          }
        }}
        onCancel={() => setStaffToDeactivate(null)}
        isLoading={deactivateMutation.isPending}
      />

      {/* ================= ACTIVATE STAFF CONFIRM ================= */}
      <ConfirmDialog
        isOpen={!!staffToActivate}
        title="Activate Staff Account"
        variant="primary"
        message={`Re-enable system access for ${staffToActivate?.name} (@${staffToActivate?.username})?`}
        confirmLabel="Activate Account"
        onConfirm={() => {
          if (staffToActivate) {
            activateMutation.mutate(staffToActivate.id);
          }
        }}
        onCancel={() => setStaffToActivate(null)}
        isLoading={activateMutation.isPending}
      />
    </div>
  );
};

export default StaffPage;
