import React, { useRef } from 'react';
import { Sale } from '../types';
import { Printer, Download, CheckCircle2, X, Store, Calendar, CreditCard, User, FileText } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `================================================
INVOICE: ${sale.invoiceNumber}
Date: ${sale.createdAt}
Cashier: ${sale.cashierName}
Customer: ${sale.customerName} ${sale.customerPhone ? '(' + sale.customerPhone + ')' : ''}
------------------------------------------------
ITEMS:
${sale.items
  .map(
    (item, i) =>
      `${i + 1}. ${item.productName} [${item.sku}]\n   ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.total.toFixed(2)}`
  )
  .join('\n')}
------------------------------------------------
Subtotal: $${sale.subtotal.toFixed(2)}
Tax (8%): $${sale.taxAmount.toFixed(2)}
Discount: -$${sale.discountAmount.toFixed(2)}
TOTAL AMOUNT: $${sale.totalAmount.toFixed(2)}
Payment Method: ${sale.paymentMethod}
Amount Received: $${sale.amountReceived.toFixed(2)}
Change Given: $${sale.changeGiven.toFixed(2)}
Status: ${sale.paymentStatus}
================================================
Thank you for shopping with us!
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sale.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="invoice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="invoice-modal-container"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Invoice Generated</h2>
              <p className="text-xs text-slate-500">{sale.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Print
            </button>
            <button
              id="btn-download-invoice"
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Text Receipt
            </button>
            <button
              id="btn-close-invoice"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 overflow-y-auto" ref={printRef}>
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs print:border-none print:shadow-none">
            {/* Store Branding */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <Store className="w-6 h-6 text-indigo-600" />
                  <span className="text-xl font-bold tracking-tight text-slate-900">APEX COMMERCE</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Retail & POS Inventory Systems</p>
                <p className="text-xs text-slate-500">100 Tech Enterprise Blvd, Suite 400</p>
                <p className="text-xs text-slate-500">Tax ID: US-882-991204</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {sale.paymentStatus}
                </span>
                <p className="text-lg font-mono font-bold text-slate-800 mt-1">{sale.invoiceNumber}</p>
                <p className="text-xs text-slate-500 flex items-center justify-end mt-1">
                  <Calendar className="w-3 h-3 mr-1" /> {sale.createdAt}
                </p>
              </div>
            </div>

            {/* Bill Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Billed To</span>
                <p className="font-medium text-slate-900 text-sm mt-0.5">{sale.customerName}</p>
                {sale.customerPhone && <p className="text-slate-500">{sale.customerPhone}</p>}
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Processed By</span>
                <p className="font-medium text-slate-900 text-sm mt-0.5 flex items-center justify-end">
                  <User className="w-3 h-3 mr-1 text-slate-400" /> {sale.cashierName}
                </p>
                <p className="text-slate-500 flex items-center justify-end mt-0.5">
                  <CreditCard className="w-3 h-3 mr-1 text-slate-400" /> {sale.paymentMethod}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">SKU</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-2.5 text-center font-mono text-slate-500 text-[11px]">{item.sku}</td>
                      <td className="py-2.5 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-center font-medium text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="mt-5 border-t border-slate-200 pt-4 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${sale.subtotal.toFixed(2)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Discount</span>
                    <span>-${sale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax (8%)</span>
                  <span>${sale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-indigo-600">${sale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between text-slate-500">
                  <span>Amount Paid ({sale.paymentMethod})</span>
                  <span>${sale.amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Change Due</span>
                  <span>${sale.changeGiven.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
              <p>Items may be returned in original condition within 14 days with this receipt.</p>
              <p className="mt-0.5">Thank you for your business!</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            id="btn-done-invoice"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
