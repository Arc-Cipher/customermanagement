/**
 * BillingPage — Point-of-Sale screen
 *
 * Fixes applied (v2):
 *  1. Barcode dropdown no longer clipped — Card uses overflowVisible prop.
 *  2. Print receipt uses a portal-style #receipt-print-root div with proper
 *     80 mm thermal-roll formatting; the modal chrome is hidden on print.
 *  3. Selected customer + phone query are persisted to sessionStorage so
 *     switching tabs and coming back does NOT lose the customer.
 *  4. Mature, structured UI layout with proper visual hierarchy.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Search,
  UserCheck,
  UserPlus,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  Printer,
  RotateCcw,
  CheckCircle,
  Receipt,
  X,
  Star,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { formatINR } from '../../utils/currency';
import { getCustomerByPhone, createCustomer } from '../../api/customers';
import { listProducts, getProductByBarcode } from '../../api/products';
import { createPurchase } from '../../api/purchases';
import type { CustomerResponse } from '../../types/customer';
import type { ProductResponse } from '../../types/product';
import type { PurchaseResponse } from '../../types/purchase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

// ─── Session-persistence keys ────────────────────────────────────────────────
const SESSION_CUSTOMER_KEY = 'billing_selected_customer';
const SESSION_PHONE_KEY = 'billing_phone_search';
const SESSION_CART_KEY = 'billing_cart';
const SESSION_POINTS_KEY = 'billing_points_to_redeem';

function sessionSave(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function sessionLoad<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function sessionClear(...keys: string[]) {
  keys.forEach((k) => sessionStorage.removeItem(k));
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface CartItem {
  product: ProductResponse;
  quantity: number;
}

// ─── Receipt portal component ─────────────────────────────────────────────────
interface ReceiptPortalProps {
  purchase: PurchaseResponse;
  cashierName: string;
}

const ReceiptPortal: React.FC<ReceiptPortalProps> = ({ purchase, cashierName }) => {
  const el = document.getElementById('receipt-print-root');
  if (!el) return null;

  const date = new Date(purchase.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return createPortal(
    <div className="receipt-paper" style={{ width: '100%', maxWidth: '72mm', margin: '0 auto', fontFamily: "'Courier New', monospace", fontSize: '11px', lineHeight: '1.55', color: '#000' }}>
      {/* Store header */}
      <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px dashed #000', marginBottom: '8px' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: '900', fontSize: '15px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          SuperMart
        </div>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#444', marginTop: '2px' }}>
          Premium Groceries &amp; Daily Needs
        </div>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#444' }}>
          Tel: +91 98765 43210 · Bengaluru, India
        </div>
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#666', marginTop: '2px' }}>
          GSTIN: 27AABCS1429B1Z
        </div>
      </div>

      {/* Bill meta */}
      <div style={{ marginBottom: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold' }}>Invoice #</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>INV-{purchase.id}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td style={{ textAlign: 'right' }}>{dateStr}</td>
            </tr>
            <tr>
              <td>Time</td>
              <td style={{ textAlign: 'right' }}>{timeStr}</td>
            </tr>
            <tr>
              <td>Cashier</td>
              <td style={{ textAlign: 'right' }}>{purchase.cashierName || cashierName}</td>
            </tr>
            <tr>
              <td>Customer</td>
              <td style={{ textAlign: 'right' }}>{purchase.customerName || 'Walk-in'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginBottom: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', paddingBottom: '4px', fontWeight: 'bold', fontSize: '10px' }}>Item</th>
              <th style={{ textAlign: 'center', paddingBottom: '4px', fontWeight: 'bold', fontSize: '10px', width: '28px' }}>Qty</th>
              <th style={{ textAlign: 'right', paddingBottom: '4px', fontWeight: 'bold', fontSize: '10px', width: '56px' }}>Rate</th>
              <th style={{ textAlign: 'right', paddingBottom: '4px', fontWeight: 'bold', fontSize: '10px', width: '60px' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.productName}
                </td>
                <td style={{ textAlign: 'center', paddingTop: '3px', paddingBottom: '3px' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', paddingTop: '3px', paddingBottom: '3px' }}>
                  {formatINR(item.unitPrice)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '3px', paddingBottom: '3px' }}>
                  {formatINR(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginBottom: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td style={{ textAlign: 'right' }}>{formatINR(purchase.subtotal)}</td>
            </tr>
            {purchase.discount > 0 && (
              <tr>
                <td>Points Discount ({purchase.pointsRedeemed} pts)</td>
                <td style={{ textAlign: 'right' }}>-{formatINR(purchase.discount)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', fontSize: '13px' }}>
              <td style={{ paddingTop: '4px' }}>TOTAL</td>
              <td style={{ textAlign: 'right', paddingTop: '4px' }}>{formatINR(purchase.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Loyalty summary */}
      {purchase.customerId && (purchase.pointsEarned > 0 || purchase.pointsRedeemed > 0) && (
        <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', marginBottom: '8px', fontSize: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px', fontFamily: 'Arial, sans-serif' }}>
            Loyalty Points Summary
          </div>
          {purchase.pointsEarned > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Points Earned</span>
              <span>+{purchase.pointsEarned} pts</span>
            </div>
          )}
          {purchase.pointsRedeemed > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Points Redeemed</span>
              <span>-{purchase.pointsRedeemed} pts</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#444' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#000', marginBottom: '3px' }}>
          Thank you for shopping at SuperMart!
        </div>
        <div>Goods may be returned within 7 days with this bill.</div>
        <div style={{ marginTop: '4px', fontSize: '8px', color: '#888' }}>
          *** Computer Generated Receipt ***
        </div>
      </div>
    </div>,
    el
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError, handleApiError } = useToast();

  // ── Customer state (persisted to sessionStorage) ────────────────────────
  const [phoneSearch, setPhoneSearch] = useState<string>(
    () => sessionLoad<string>(SESSION_PHONE_KEY) ?? ''
  );
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(
    () => sessionLoad<CustomerResponse>(SESSION_CUSTOMER_KEY)
  );
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // ── Product search & cart ───────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState('');
  const debouncedProductQuery = useDebounce(productQuery, 300);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(
    () => sessionLoad<CartItem[]>(SESSION_CART_KEY) ?? []
  );
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(
    () => sessionLoad<number>(SESSION_POINTS_KEY) ?? 0
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ── Receipt ─────────────────────────────────────────────────────────────
  const [completedPurchase, setCompletedPurchase] = useState<PurchaseResponse | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const productSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Persist customer & cart to sessionStorage whenever they change
  useEffect(() => {
    sessionSave(SESSION_CUSTOMER_KEY, selectedCustomer);
  }, [selectedCustomer]);

  useEffect(() => {
    sessionSave(SESSION_PHONE_KEY, phoneSearch);
  }, [phoneSearch]);

  useEffect(() => {
    sessionSave(SESSION_CART_KEY, cart);
  }, [cart]);

  useEffect(() => {
    sessionSave(SESSION_POINTS_KEY, pointsToRedeem);
  }, [pointsToRedeem]);

  // Show/hide dropdown
  useEffect(() => {
    setShowDropdown(debouncedProductQuery.trim().length >= 2);
  }, [debouncedProductQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Product search query
  const { data: searchResults, isFetching: isSearchingProducts } = useQuery({
    queryKey: ['billing-product-search', debouncedProductQuery],
    queryFn: () => listProducts({ q: debouncedProductQuery, size: 8 }),
    enabled: debouncedProductQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  // ── Totals ──────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const maxRedeemablePoints = selectedCustomer
    ? Math.min(selectedCustomer.loyaltyPoints, Math.floor(subtotal))
    : 0;

  useEffect(() => {
    if (pointsToRedeem > maxRedeemablePoints) setPointsToRedeem(maxRedeemablePoints);
  }, [maxRedeemablePoints, pointsToRedeem]);

  const discount = Math.min(pointsToRedeem, subtotal);
  const totalAmount = Math.max(0, subtotal - discount);
  const estimatedPointsEarned = Math.floor(totalAmount / 100);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Customer handlers ────────────────────────────────────────────────────
  const handleCustomerSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phone = phoneSearch.trim();
    if (!phone) return;

    setCustomerSearchLoading(true);
    setShowRegisterForm(false);

    try {
      const customer = await getCustomerByPhone(phone);
      if (customer.status !== 'ACTIVE') {
        toastError('This customer account is inactive. Please reactivate via the Customers page.');
        setSelectedCustomer(null);
      } else {
        setSelectedCustomer(customer);
        success(`Found: ${customer.name}`);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setShowRegisterForm(true);
        setSelectedCustomer(null);
      } else {
        handleApiError(err, 'Failed to find customer');
      }
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !phoneSearch.trim()) {
      toastError('Name and phone number are required');
      return;
    }
    setRegisterLoading(true);
    try {
      const created = await createCustomer({
        name: newCustomerName.trim(),
        phone: phoneSearch.trim(),
        marketingConsent: true,
      });
      setSelectedCustomer(created);
      setShowRegisterForm(false);
      setNewCustomerName('');
      success(`${created.name} registered and selected`);
    } catch (err: unknown) {
      handleApiError(err, 'Could not register customer');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setPhoneSearch('');
    setShowRegisterForm(false);
    setNewCustomerName('');
    setPointsToRedeem(0);
    sessionClear(SESSION_CUSTOMER_KEY, SESSION_PHONE_KEY, SESSION_POINTS_KEY);
  }, []);

  // ── Cart handlers ────────────────────────────────────────────────────────
  const addToCart = useCallback((product: ProductResponse) => {
    if (!product.active) {
      toastError('This product is inactive and cannot be sold.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductQuery('');
    setShowDropdown(false);
    productSearchRef.current?.focus();
  }, [toastError]);

  const handleProductKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = productQuery.trim();
      if (!query) return;
      try {
        const product = await getProductByBarcode(query);
        addToCart(product);
      } catch {
        if (searchResults && searchResults.content.length > 0) {
          addToCart(searchResults.content[0]);
        } else {
          toastError(`No product found for "${query}"`);
        }
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const setExplicitQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const removeFromCart = (productId: number) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const clearCart = () => {
    setCart([]);
    setPointsToRedeem(0);
    sessionClear(SESSION_CART_KEY, SESSION_POINTS_KEY);
  };

  // ── Checkout ─────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toastError('Add at least one product before checkout.');
      return;
    }
    const overStock = cart.filter((i) => i.quantity > i.product.stockQuantity);
    if (overStock.length > 0) {
      const names = overStock.map((i) => i.product.name).join(', ');
      if (!window.confirm(`Items exceed available stock: ${names}. Proceed anyway?`)) return;
    }

    setIsCheckingOut(true);
    try {
      const response = await createPurchase({
        customerId: selectedCustomer?.id,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        pointsToRedeem: selectedCustomer && pointsToRedeem > 0 ? pointsToRedeem : undefined,
      });
      setCompletedPurchase(response);
      setShowReceipt(true);
      clearCart();
      handleClearCustomer();
      success('Sale completed!');
    } catch (err: unknown) {
      handleApiError(err, 'Failed to complete transaction');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleNewBill = () => {
    clearCart();
    handleClearCustomer();
    setCompletedPurchase(null);
    setShowReceipt(false);
  };

  const handlePrint = () => window.print();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Receipt print portal (hidden on screen, visible @media print) */}
      {completedPurchase && showReceipt && (
        <ReceiptPortal purchase={completedPurchase} cashierName={user?.name ?? ''} />
      )}

      {/* ── Receipt modal (screen only) ────────────────────────────────── */}
      {showReceipt && completedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

          {/* Receipt sheet */}
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold">Receipt — INV-{completedPurchase.id}</span>
              </div>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt body — screen preview */}
            <div className="overflow-y-auto max-h-[70vh] p-5 font-mono text-xs text-slate-800 space-y-3">
              {/* Store name */}
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <p className="font-sans font-black text-base tracking-widest uppercase text-slate-900">
                  SuperMart
                </p>
                <p className="text-[10px] text-slate-500 font-sans">Premium Groceries &amp; Daily Needs</p>
                <p className="text-[10px] text-slate-500 font-sans">Tel: +91 98765 43210 · Bengaluru</p>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">GSTIN: 27AABCS1429B1Z</p>
              </div>

              {/* Meta */}
              <div className="space-y-0.5 border-b border-dashed border-gray-300 pb-3">
                {[
                  ['Invoice #', `INV-${completedPurchase.id}`],
                  [
                    'Date',
                    new Date(completedPurchase.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }),
                  ],
                  [
                    'Time',
                    new Date(completedPurchase.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    }),
                  ],
                  ['Cashier', completedPurchase.cashierName || user?.name || '—'],
                  ['Customer', completedPurchase.customerName || 'Walk-in'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-gray-300 pb-3">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase border-b border-gray-200 pb-1 mb-1">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>
                {completedPurchase.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1 border-b border-dotted border-gray-100 last:border-0">
                    <span className="col-span-5 truncate text-slate-800 font-medium">{item.productName}</span>
                    <span className="col-span-2 text-center text-slate-600">{item.quantity}</span>
                    <span className="col-span-2 text-right text-slate-600">{formatINR(item.unitPrice)}</span>
                    <span className="col-span-3 text-right font-bold text-slate-900">{formatINR(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 border-b border-dashed border-gray-300 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatINR(completedPurchase.subtotal)}</span>
                </div>
                {completedPurchase.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Points Redeemed ({completedPurchase.pointsRedeemed} pts)</span>
                    <span>−{formatINR(completedPurchase.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-gray-300 pt-1.5">
                  <span>TOTAL</span>
                  <span>{formatINR(completedPurchase.totalAmount)}</span>
                </div>
              </div>

              {/* Loyalty */}
              {completedPurchase.customerId &&
                (completedPurchase.pointsEarned > 0 || completedPurchase.pointsRedeemed > 0) && (
                  <div className="bg-indigo-50 rounded-lg px-3 py-2 space-y-0.5 text-[10px]">
                    <p className="font-sans font-semibold text-indigo-800 text-xs mb-1">
                      Loyalty Points
                    </p>
                    {completedPurchase.pointsEarned > 0 && (
                      <div className="flex justify-between text-indigo-700">
                        <span>Earned this visit</span>
                        <span className="font-bold">+{completedPurchase.pointsEarned} pts</span>
                      </div>
                    )}
                    {completedPurchase.pointsRedeemed > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>Redeemed</span>
                        <span className="font-bold">−{completedPurchase.pointsRedeemed} pts</span>
                      </div>
                    )}
                  </div>
                )}

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 font-sans pt-1">
                <p className="font-semibold text-slate-600">Thank you for shopping at SuperMart!</p>
                <p className="mt-0.5">Goods may be returned within 7 days with this bill.</p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 bg-gray-50">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleNewBill}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main billing layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* ── LEFT PANEL ── */}
        <div className="xl:col-span-5 space-y-4">

          {/* ── Customer Section ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-700">Customer</h3>
              </div>
              {selectedCustomer && (
                <button
                  onClick={handleClearCustomer}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                  title="Clear customer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="p-5">
              {selectedCustomer ? (
                /* ── Selected customer card ── */
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-700">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm leading-tight">
                        {selectedCustomer.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Star className="w-2.5 h-2.5" /> Member
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedCustomer.phone}</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-center">
                        <p className="text-[10px] text-indigo-500 font-medium leading-none mb-0.5">
                          Loyalty Balance
                        </p>
                        <p className="text-base font-black text-indigo-700 leading-none">
                          {selectedCustomer.loyaltyPoints}
                          <span className="text-xs font-semibold ml-1 text-indigo-500">pts</span>
                        </p>
                        <p className="text-[9px] text-indigo-400 mt-0.5">
                          ≈ {formatINR(selectedCustomer.loyaltyPoints)} value
                        </p>
                      </div>
                      {cart.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
                          <p className="text-[10px] text-slate-500 font-medium leading-none mb-0.5">
                            Will Earn
                          </p>
                          <p className="text-base font-black text-slate-700 leading-none">
                            +{estimatedPointsEarned}
                            <span className="text-xs font-semibold ml-1 text-slate-500">pts</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Customer search ── */
                <div className="space-y-3">
                  <form onSubmit={handleCustomerSearch} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit mobile number"
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={customerSearchLoading || phoneSearch.length !== 10}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {customerSearchLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Search
                    </button>
                  </form>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 text-slate-500 text-xs hover:border-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    Continue as walk-in customer
                  </button>

                  {/* Inline registration panel */}
                  {showRegisterForm && (
                    <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserPlus className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-semibold text-amber-800">
                          Phone not found — Register new member
                        </p>
                      </div>
                      <form onSubmit={handleRegisterCustomer} className="space-y-3">
                        <Input
                          label="Full Name"
                          placeholder="e.g. Ramesh Kumar"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          required
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRegisterForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={registerLoading}
                          >
                            Register &amp; Select
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Product Search ── */}
          {/* overflowVisible so dropdown is not clipped */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Product Search</span>
              </div>
            }
            subtitle="Type name or scan barcode, then press Enter"
            overflowVisible
          >
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  onKeyDown={handleProductKeyDown}
                  onFocus={() => debouncedProductQuery.trim().length >= 2 && setShowDropdown(true)}
                  placeholder="Scan barcode or type item name…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                />
                {isSearchingProducts && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                Press <kbd className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to add by exact barcode
              </p>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {isSearchingProducts ? (
                      <div className="p-4 text-center text-xs text-slate-400">Searching…</div>
                    ) : !searchResults || searchResults.content.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No products match &ldquo;{debouncedProductQuery}&rdquo;
                      </div>
                    ) : (
                      searchResults.content.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onMouseDown={(e) => {
                            // Use mousedown to fire before blur
                            e.preventDefault();
                            addToCart(prod);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 truncate">
                              {prod.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span className="font-mono">{prod.barcode}</span>
                              <span>·</span>
                              <span>{prod.categoryName}</span>
                              <span>·</span>
                              <span
                                className={
                                  prod.stockQuantity <= prod.lowStockThreshold
                                    ? 'text-amber-600 font-semibold'
                                    : ''
                                }
                              >
                                {prod.stockQuantity} in stock
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-slate-900">{formatINR(prod.price)}</p>
                            <p className="text-[10px] text-indigo-500 font-medium group-hover:underline">
                              + Add
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT PANEL — Cart ── */}
        <div className="xl:col-span-7">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Cart header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-700">
                  Current Bill
                  {cartItemCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>

            {/* Cart body */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                <ShoppingCart className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium text-slate-500">Cart is empty</p>
                <p className="text-xs text-slate-400 mt-1">Search for products on the left to begin</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Product
                      </th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Price
                      </th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Total
                      </th>
                      <th className="px-2 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cart.map((item) => {
                      const overStock = item.quantity > item.product.stockQuantity;
                      return (
                        <tr
                          key={item.product.id}
                          className={`group transition-colors ${overStock ? 'bg-amber-50/50' : 'hover:bg-slate-50/70'}`}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900 text-sm leading-tight">
                              {item.product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {item.product.barcode}
                              </span>
                              {overStock && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Only {item.product.stockQuantity} left
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="px-2 py-1.5 text-slate-500 hover:bg-gray-100 hover:text-slate-700 transition-colors"
                                aria-label="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  setExplicitQty(item.product.id, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-10 text-center text-xs font-bold text-slate-900 border-x border-gray-200 py-1.5 focus:outline-none focus:bg-indigo-50"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="px-2 py-1.5 text-slate-500 hover:bg-gray-100 hover:text-slate-700 transition-colors"
                                aria-label="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-500 whitespace-nowrap">
                            {formatINR(item.product.price)}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                            {formatINR(item.product.price * item.quantity)}
                          </td>

                          <td className="pr-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Billing summary footer ── */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 bg-slate-50 px-5 py-5 space-y-4">

                {/* Points redemption */}
                {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
                  <div className="bg-white border border-indigo-100 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-semibold text-slate-700">
                          Redeem Loyalty Points
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Available:{' '}
                        <strong className="text-slate-700">{selectedCustomer.loyaltyPoints} pts</strong>
                        <span className="text-slate-400"> (1 pt = ₹1)</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={maxRedeemablePoints}
                        value={pointsToRedeem}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setPointsToRedeem(Math.min(Math.max(0, val), maxRedeemablePoints));
                        }}
                        className="w-28 rounded-lg border border-gray-300 py-1.5 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setPointsToRedeem(maxRedeemablePoints)}
                        disabled={pointsToRedeem === maxRedeemablePoints}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-slate-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                      >
                        Use Max ({maxRedeemablePoints})
                      </button>
                      {pointsToRedeem > 0 && (
                        <button
                          type="button"
                          onClick={() => setPointsToRedeem(0)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg">
                        Discount applied: −{formatINR(discount)}
                      </p>
                    )}
                  </div>
                )}

                {/* Summary rows */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal ({cartItemCount} items)</span>
                    <span className="font-medium text-slate-800">{formatINR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-700 font-medium">
                      <span>Points Discount ({pointsToRedeem} pts)</span>
                      <span>−{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-slate-700">Total Payable</span>
                    <span className="text-2xl font-black text-indigo-600 tracking-tight">
                      {formatINR(totalAmount)}
                    </span>
                  </div>
                  {selectedCustomer && estimatedPointsEarned > 0 && (
                    <div className="flex items-center justify-between text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                      <span>Points to be earned on this purchase</span>
                      <span className="font-bold">+{estimatedPointsEarned} pts</span>
                    </div>
                  )}
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <Spinner size="sm" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isCheckingOut ? 'Processing…' : `Checkout — ${formatINR(totalAmount)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingPage;
