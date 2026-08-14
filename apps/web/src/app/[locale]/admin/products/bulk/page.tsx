'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function BulkProductsPage() {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent) {
      toast.error('Please select a valid CSV file first');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/admin/products/import', { csvContent });
      setImportResult(response.data);
      toast.success('CSV import completed');
    } catch (error: any) {
      console.error('Import failed', error);
      toast.error(error.response?.data?.message || 'Bulk CSV import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products/export');
      const csv = response.data.csv;

      if (!csv) {
        toast.error('No product data available to export');
        return;
      }

      // Create blob and trigger file download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `beauty_parle_products_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Product database exported as CSV file');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('CSV export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-playfair font-bold bg-gradient-to-r from-pink-400 to-rose-300 bg-clip-text text-transparent">Bulk Product Management</h1>
            <p className="text-sm text-muted-foreground">Import products from CSV files or download the full catalog inventory.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Import Card */}
            <div className="bg-card p-6 rounded-2xl border border-border/50 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Upload size={20} className="text-pink-400" />
                  Bulk CSV Import
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Select a product CSV. Ensure the headers include: <code className="bg-secondary px-1.5 py-0.5 rounded text-pink-300">name</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-pink-300">price</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-pink-300">category</code>, and <code className="bg-secondary px-1.5 py-0.5 rounded text-pink-300">stock</code>.
                </p>

                {/* Drag Drop Area */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 hover:border-pink-500/40 rounded-xl p-8 cursor-pointer hover:bg-secondary/10 transition group">
                  <FileText size={36} className="text-muted-foreground/40 group-hover:text-pink-400/60 mb-2 transition" />
                  <span className="text-sm font-semibold truncate max-w-[240px]">
                    {fileName || 'Choose CSV File'}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleImport}
                disabled={loading || !csvContent}
                className="mt-6 w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-xl font-semibold shadow disabled:opacity-50 transition"
              >
                {loading ? 'Uploading & Parsing...' : 'Import Products'}
              </button>
            </div>

            {/* Export Card */}
            <div className="bg-card p-6 rounded-2xl border border-border/50 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Download size={20} className="text-pink-400" />
                  Bulk CSV Export
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Download all active products inside the store catalog, formatted as a standard RFC-4180 CSV spreadsheet.
                </p>

                <div className="flex flex-col items-center justify-center p-8 bg-secondary/20 rounded-xl border border-border/30">
                  <FileText size={36} className="text-muted-foreground/30 mb-2" />
                  <span className="text-xs text-muted-foreground">Product catalog ready to build</span>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={loading}
                className="mt-6 w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl font-semibold border border-border/40 transition flex items-center justify-center gap-1.5"
              >
                <Download size={16} />
                Export Products CSV
              </button>
            </div>

          </div>

          {/* Import result panel */}
          {importResult && (
            <div className="bg-card p-6 rounded-2xl border border-border/50 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle size={20} className="text-pink-400" />
                Import Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-emerald-400">{importResult.success}</p>
                  <p className="text-xs text-muted-foreground mt-1">Successfully Imported</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-rose-400">{importResult.failed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Failed Rows</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Parsing Error Logs
                  </p>
                  <div className="bg-secondary/40 border border-border/40 p-4 rounded-xl text-xs font-mono max-h-[200px] overflow-y-auto space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-rose-300">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
