/**
 * Store Context — manages auth, inventory, billing, and bills history
 * All data is persisted to localStorage, scoped per user's unique ID
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/* ───────────── Types ───────────── */

export interface User {
  uniqueId: string;
  name: string;
  age: string;
  email: string;
  mobile: string;
  shopName: string;
  gstNo: string;
  address: string;
  city: string;
  district: string;
  state: string;
  password: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  hsn: string;
}

export interface BillItem {
  productId: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  unit: string;
  hsn: string;
}

export interface Bill {
  id: string;
  billNo: number;
  date: string;
  items: BillItem[];
  subTotal: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

interface StoreContextType {
  currentUser: User | null;
  login: (uniqueId: string, password: string) => { success: boolean; error?: string };
  register: (userData: Omit<User, 'uniqueId' | 'createdAt'>) => { success: boolean; uniqueId?: string; error?: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  currentBillItems: BillItem[];
  addToBill: (product: Product, qty: number) => { success: boolean; error?: string };
  removeFromBill: (productId: string) => void;
  updateBillItemQty: (productId: string, qty: number) => void;
  clearBill: () => void;

  bills: Bill[];
  saveBill: (customerName: string, customerPhone: string, customerAddress: string, cgstPercent: number, sgstPercent: number) => Bill;

  todaysBills: Bill[];
  todaysSales: number;
}

/* ───────────── Helpers ───────────── */

function generateUniqueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'VND-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key: string, value: unknown): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/* ───────────── Context ───────────── */

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStorage('billing_currentUser', null));
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [currentBillItems, setCurrentBillItems] = useState<BillItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  /* Load user-specific data on mount or user change */
  useEffect(() => {
    if (currentUser) {
      setProducts(getStorage(`products_${currentUser.uniqueId}`, []));
      setBills(getStorage(`bills_${currentUser.uniqueId}`, []));
      setCurrentBillItems(getStorage(`currentBill_${currentUser.uniqueId}`, []));
    } else {
      setProducts([]);
      setBills([]);
      setCurrentBillItems([]);
    }
    setInitialized(true);
  }, [currentUser?.uniqueId]);

  /* Persist state changes */
  useEffect(() => { setStorage('billing_currentUser', currentUser); }, [currentUser]);
  useEffect(() => {
    if (currentUser && initialized) setStorage(`products_${currentUser.uniqueId}`, products);
  }, [products, currentUser, initialized]);
  useEffect(() => {
    if (currentUser && initialized) setStorage(`bills_${currentUser.uniqueId}`, bills);
  }, [bills, currentUser, initialized]);
  useEffect(() => {
    if (currentUser && initialized) setStorage(`currentBill_${currentUser.uniqueId}`, currentBillItems);
  }, [currentBillItems, currentUser, initialized]);

  /* ── Auth ── */
  const login = useCallback((uniqueId: string, password: string) => {
    const users: User[] = getStorage('billing_allUsers', []);
    const user = users.find(u => u.uniqueId.toUpperCase() === uniqueId.toUpperCase());
    if (!user) return { success: false, error: 'Invalid Unique ID. Please check and try again.' };
    if (user.password !== password) return { success: false, error: 'Incorrect password. Please try again.' };
    setCurrentUser(user);
    return { success: true };
  }, []);

  const register = useCallback((userData: Omit<User, 'uniqueId' | 'createdAt'>) => {
    const users: User[] = getStorage('billing_allUsers', []);
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email already registered.' };
    }
    if (users.find(u => u.mobile === userData.mobile)) {
      return { success: false, error: 'Mobile number already registered.' };
    }
    let uniqueId = generateUniqueId();
    while (users.find(u => u.uniqueId === uniqueId)) {
      uniqueId = generateUniqueId();
    }
    const newUser: User = { ...userData, uniqueId, createdAt: new Date().toISOString() };
    users.push(newUser);
    setStorage('billing_allUsers', users);
    return { success: true, uniqueId };
  }, []);

  const logout = useCallback(() => { setCurrentUser(null); }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data, uniqueId: currentUser.uniqueId };
    setCurrentUser(updated);
    const users: User[] = getStorage('billing_allUsers', []);
    const idx = users.findIndex(u => u.uniqueId === currentUser.uniqueId);
    if (idx >= 0) { users[idx] = updated; setStorage('billing_allUsers', users); }
  }, [currentUser]);

  /* ── Products ── */
  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: crypto.randomUUID() }]);
  }, []);
  const updateProduct = useCallback((id: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);
  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  /* ── Billing ── */
  const addToBill = useCallback((product: Product, qty: number) => {
    setCurrentBillItems(prev => {
      if (prev.find(item => item.productId === product.id)) {
        return prev; // handled by caller with error message
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: qty,
        rate: product.price,
        amount: product.price * qty,
        unit: product.unit,
        hsn: product.hsn,
      }];
    });
    // Check if already exists for return value
    const exists = currentBillItems.find(item => item.productId === product.id);
    if (exists) return { success: false, error: 'Product already added! Increase quantity below.' };
    return { success: true };
  }, [currentBillItems]);

  const removeFromBill = useCallback((productId: string) => {
    setCurrentBillItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateBillItemQty = useCallback((productId: string, qty: number) => {
    setCurrentBillItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity: qty, amount: item.rate * qty } : item
    ));
  }, []);

  const clearBill = useCallback(() => { setCurrentBillItems([]); }, []);

  const saveBill = useCallback((customerName: string, customerPhone: string, customerAddress: string, cgstPercent: number, sgstPercent: number) => {
    const subTotal = currentBillItems.reduce((sum, item) => sum + item.amount, 0);
    const cgstAmount = subTotal * cgstPercent / 100;
    const sgstAmount = subTotal * sgstPercent / 100;
    const bill: Bill = {
      id: crypto.randomUUID(),
      billNo: bills.length + 1,
      date: new Date().toISOString(),
      items: [...currentBillItems],
      subTotal,
      cgstPercent,
      sgstPercent,
      cgstAmount,
      sgstAmount,
      grandTotal: subTotal + cgstAmount + sgstAmount,
      customerName,
      customerPhone,
      customerAddress,
    };
    setBills(prev => [...prev, bill]);
    setCurrentBillItems([]);
    return bill;
  }, [currentBillItems, bills]);

  /* ── Stats ── */
  const today = new Date().toDateString();
  const todaysBills = bills.filter(b => new Date(b.date).toDateString() === today);
  const todaysSales = todaysBills.reduce((sum, b) => sum + b.grandTotal, 0);

  return (
    <StoreContext.Provider value={{
      currentUser, login, register, logout, updateProfile,
      products, addProduct, updateProduct, deleteProduct,
      currentBillItems, addToBill, removeFromBill, updateBillItemQty, clearBill,
      bills, saveBill, todaysBills, todaysSales,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
