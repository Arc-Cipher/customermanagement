import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { ProductResponse, StockAdjustRequest } from '../../types/product';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StockAdjustFormProps {
  product: ProductResponse;
  onSubmit: (data: StockAdjustRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const StockAdjustForm: React.FC<StockAdjustFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [changeStr, setChangeStr] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const change = parseInt(changeStr, 10);
  const isValidNumber = !isNaN(change);
  const newStock = isValidNumber ? product.stockQuantity + change : product.stockQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber || change === 0) {
      setError('Please enter a non-zero adjustment amount (+ to add, - to remove)');
      return;
    }
    if (newStock < 0) {
      setError(`Stock cannot drop below 0. Max reduction is -${product.stockQuantity}`);
      return;
    }

    setError(null);
    await onSubmit({ change });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
        <div className="text-xs text-slate-500 font-medium uppercase">Product</div>
        <div className="font-semibold text-slate-800 text-sm">{product.name}</div>
        <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
          <span>Barcode: {product.barcode}</span>
          <span>
            Current Stock:{' '}
            <strong className="text-slate-900 font-bold">{product.stockQuantity}</strong>
          </span>
        </div>
      </div>

      <div>
        <Input
          label="Stock Adjustment (+ to add, - to deduct)"
          type="number"
          step="1"
          placeholder="e.g. 50 or -10"
          value={changeStr}
          onChange={(e) => {
            setChangeStr(e.target.value);
            setError(null);
          }}
          error={error || undefined}
          helperText="Use positive numbers for restock/returns, negative for wastage/shrinkage"
          required
        />
      </div>

      {isValidNumber && change !== 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm">
          <div className="flex items-center gap-1.5 font-medium text-indigo-900">
            {change > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            )}
            <span>Projected New Stock:</span>
          </div>
          <span
            className={`font-bold ${
              newStock < 0 ? 'text-red-600' : 'text-indigo-950'
            }`}
          >
            {newStock} units
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!isValidNumber || change === 0 || newStock < 0}
        >
          Confirm Adjustment
        </Button>
      </div>
    </form>
  );
};

export default StockAdjustForm;
