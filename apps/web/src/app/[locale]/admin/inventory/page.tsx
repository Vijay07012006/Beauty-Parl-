'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { 
  Package, 
  AlertTriangle, 
  RefreshCw, 
  Edit3, 
  Check,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/inventory/low-stock');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch low stock products', error);
      toast.error('Failed to load low stock inventory list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleStartEdit = (product: Product) => {
    setEditingId(product.id);
    setEditStock(product.stock);
  };

  const handleSaveStock = async (id: number) => {
    try {
      // Find full product info to comply with CreateProductDto/Update payload
      const prodRes = await api.get(`/products/${id}`);
      const product = prodRes.data;

      // Update product payload with new stock
      await api.put(`/products/${id}`, {
        ...product,
        stock: editStock
      });

      toast.success('Inventory stock level updated successfully');
      setEditingId(null);
      fetchLowStock();
    } catch (error: any) {
      console.error('Failed to update stock', error);
      toast.error(error.response?.data?.message || 'Failed to update stock level');
    }
  };

  const handleQuickRestock = async (id: number) => {
    try {
      const prodRes = await api.get(`/products/${id}`);
      const product = prodRes.data;

      // Increment stock by 50 units
      await api.put(`/products/${id}`, {
        ...product,
        stock: (product.stock || 0) + 50
      });

      toast.success('Quick restocked 50 items successfully');
      fetchLowStock();
    } catch (error) {
      console.error('Quick restock failed', error);
      toast.error('Restock action failed');
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-playfair font-bold bg-gradient-to-r from-pink-400 to-rose-300 bg-clip-text text-transparent">Inventory Monitor</h1>
              <p className="text-sm text-muted-foreground">Manage and restock products running low on inventory.</p>
            </div>
            
            <button
              onClick={fetchLowStock}
              className="p-2.5 bg-secondary hover:bg-secondary/80 rounded-xl transition text-sm flex items-center gap-1.5 font-semibold"
            >
              <RefreshCw size={16} />
              Reload List
            </button>
          </div>

          {/* Alert Banner if items are low */}
          {products.length > 0 && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-200">
              <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-sm">Critical Inventory Alert</h4>
                <p className="text-xs mt-1">There are {products.length} products with stock counts below 10 units. Restock items to prevent customer checkout issues.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-card p-12 text-center rounded-2xl border border-border/50 text-muted-foreground flex flex-col items-center justify-center">
              <Package size={48} className="text-muted-foreground/30 mb-2" />
              <p className="font-semibold">All Stocks Healthy</p>
              <p className="text-xs mt-1">No products are currently under the warning threshold of 10 items.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground text-xs font-semibold">
                      <th className="p-4">Product ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-center">Current Stock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="p-4 text-muted-foreground font-mono">#{product.id}</td>
                        <td className="p-4 font-semibold">{product.name}</td>
                        <td className="p-4 text-muted-foreground">{product.category}</td>
                        <td className="p-4 font-bold text-pink-400">${Number(product.price).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          {editingId === product.id ? (
                            <div className="flex justify-center items-center gap-1.5">
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(parseInt(e.target.value, 10) || 0)}
                                className="w-16 px-2 py-1 bg-secondary border border-border/40 rounded-lg text-center font-bold"
                                min="0"
                              />
                              <button
                                onClick={() => handleSaveStock(product.id)}
                                className="p-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition"
                              >
                                <Check size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className={`px-3 py-1.5 rounded-full font-bold text-xs ${
                              product.stock === 0 
                                ? 'bg-rose-500/20 text-rose-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {product.stock} items low
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {editingId !== product.id && (
                              <button
                                onClick={() => handleStartEdit(product)}
                                className="p-2 hover:bg-secondary rounded-lg transition text-muted-foreground hover:text-foreground"
                                title="Edit Stock Level"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleQuickRestock(product.id)}
                              className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                            >
                              <Plus size={12} />
                              Restock 50
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
