'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
  });

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to fetch products', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
      };
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      fetchProducts();
      setShowModal(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', category: '', stock: '', image: '' });
    } catch (err) {
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-playfair font-bold">Products</h1>
            <button
              onClick={() => {
                setEditingProduct(null);
                setForm({ name: '', description: '', price: '', category: '', stock: '', image: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition cursor-pointer"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No products found. Add your first product!</div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Image</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Stock</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-secondary/20 transition">
                      <td className="px-6 py-3">
                        <div className="relative w-12 h-12 bg-secondary/20 rounded-lg overflow-hidden">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">💄</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-medium">{product.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{product.category || 'Uncategorized'}</td>
                      <td className="px-6 py-3 font-bold text-primary">${Number(product.price).toFixed(2)}</td>
                      <td className="px-6 py-3">{product.stock}</td>
                      <td className="px-6 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setForm({
                              name: product.name,
                              description: product.description,
                              price: product.price.toString(),
                              category: product.category || '',
                              stock: product.stock.toString(),
                              image: product.image || '',
                            });
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <h2 className="text-2xl font-playfair font-bold mb-4">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({...form, price: e.target.value})}
                      className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({...form, stock: e.target.value})}
                      className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({...form, image: e.target.value})}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                    placeholder="/images/products/example.jpg"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium cursor-pointer"
                  >
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-3 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
