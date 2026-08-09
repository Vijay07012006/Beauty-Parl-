'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Printer, Share2, QrCode } from 'lucide-react';

interface OrderReceiptProps {
  order: {
    id: number;
    createdAt: string;
    status: string;
    items: any[];
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    paymentMethod: string;
    shippingAddress: {
      name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  onPrint?: () => void;
  onDownload?: () => void;
}

export function OrderReceipt({ order, onPrint, onDownload }: OrderReceiptProps) {
  const t = useTranslations('orders');
  const receiptRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'paid': return 'text-green-600';
      case 'shipped': return 'text-purple-600';
      case 'processing': return 'text-blue-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/orders/${order.id}` : '';
  const qrCodeUrl = trackingUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackingUrl)}` : '';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border/50 overflow-hidden">
      {/* Printable Invoice Wrapper */}
      <div id="order-receipt-content" className="bg-white">
        {/* Receipt Header */}
        <div className="bg-primary/5 p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-playfair font-bold text-primary">Beauty Parlé</h2>
              <p className="text-sm text-muted-foreground">Where Beauty Speaks Your Language</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{t('invoice').toUpperCase()}</p>
              <p className="text-2xl font-bold text-primary">#{order.id}</p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div ref={receiptRef} className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <span className="text-sm text-muted-foreground">{t('status')}</span>
            <span className={`font-semibold capitalize ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* Address & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('shipping_address')}</h3>
              {order.shippingAddress ? (
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
                  <p className="text-sm text-foreground/80">{order.shippingAddress.address}</p>
                  <p className="text-sm text-foreground/80">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  <p className="text-sm text-muted-foreground mt-1">📞 {order.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">N/A</p>
              )}
            </div>
            <div className="text-left md:text-right">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('order_date')}</h3>
              <p className="font-medium text-foreground">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('payment_method')}: <span className="font-semibold uppercase">{order.paymentMethod}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border/50 rounded-xl overflow-hidden mt-4">
            <table className="w-full border-collapse">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">{t('product')}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-muted-foreground">{t('quantity')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('price')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">{t('total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {order.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">ID: #{item.productId || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-foreground">${Number(item.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-sm text-foreground">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 pt-4">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="text-foreground">${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span className="text-foreground">${Number(order.shipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax')}</span>
                <span className="text-foreground">${Number(order.tax).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t('discount')}</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-lg">
                <span className="text-foreground">{t('total')}</span>
                <span className="text-primary">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center pt-6 border-t border-border/50 space-y-2">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="Order Tracking QR Code" 
                className="w-[120px] h-[120px] border border-border/50 p-1.5 rounded-xl bg-white"
                crossOrigin="anonymous"
              />
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <QrCode size={16} />
              <span>{t('scan_to_track')}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50 space-y-1">
            <p className="font-semibold text-foreground/80">{t('thank_you')}</p>
            <p>{t('support')}</p>
            <p>© {new Date().getFullYear()} Beauty Parlé. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons (Excluded from printable/canvas capture area) */}
      <div className="bg-secondary/20 p-4 flex flex-wrap gap-3 justify-end border-t border-border/50 no-print">
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2 bg-white text-foreground rounded-full hover:bg-secondary transition border border-border/50 text-sm font-semibold cursor-pointer"
        >
          <Printer size={16} />
          {t('print')}
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/95 transition text-sm font-semibold cursor-pointer"
        >
          <Download size={16} />
          {t('download_pdf')}
        </button>
      </div>
    </div>
  );
}
