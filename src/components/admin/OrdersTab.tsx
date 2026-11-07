import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { exportOrdersToCSV } from '../../services/googleSheetsService';
import { apiService } from '../../services/apiService';
import {
  Search,
  Filter,
  Download,
  MessageCircle,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  X,
} from 'lucide-react';

interface OrdersTabProps {
  orders: Order[];
  currency: string;
  googleSheetsWebhookUrl: string;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onRefreshSync: (orderId: string) => void;
  onClearOrders?: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  currency,
  googleSheetsWebhookUrl,
  onUpdateOrderStatus,
  onRefreshSync,
  onClearOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleManualSync = async (order: Order) => {
    if (!googleSheetsWebhookUrl) {
      showToast('يرجى أولاً إدخال رابط Google Sheets Webhook في تبويب "ربط غوغل شيت".', 'error');
      return;
    }
    setSyncingOrderId(order.id);
    const res = await apiService.syncOrderToSheets(order, googleSheetsWebhookUrl, currency);
    setSyncingOrderId(null);
    if (res.success) {
      onRefreshSync(order.id);
      showToast(`تم إرسال الطلب ${order.orderNumber} بنجاح إلى جدول Google Sheets!`, 'success');
    } else {
      showToast(res.message || 'فشل إرسال الطلب إلى Google Sheets.', 'error');
    }
  };

  const handleBulkSync = async () => {
    if (!googleSheetsWebhookUrl) {
      showToast('يرجى أولاً إدخال رابط Google Sheets Webhook في تبويب "ربط غوغل شيت".', 'error');
      return;
    }
    setIsBulkSyncing(true);
    try {
      const res = await apiService.syncAllOrdersToSheets();
      setIsBulkSyncing(false);
      if (res.success) {
        showToast(res.message || 'تمت مزامنة الطلبات بنجاح!', 'success');
        orders.forEach((o) => onRefreshSync(o.id));
      } else {
        showToast(res.message || 'تعذرت المزامنة الجماعية.', 'error');
      }
    } catch (err: any) {
      setIsBulkSyncing(false);
      showToast(err?.message || 'خطأ أثناء المزامنة الجماعية.', 'error');
    }
  };

  const handleOpenCustomerWhatsApp = (order: Order) => {
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const itemsText = order.items
      .map((i) => `${i.productName} (مقاس: ${i.selectedSize || '-'} - لون: ${i.selectedColor || '-'})`)
      .join('، ');
    const msg = `مرحباً ${order.customerName}،\nنتواصل معك من المتجر لتأكيد طلبك رقم (${order.orderNumber}):\nالمنتج: ${itemsText}\nالمبلغ المطلوب عند الاستلام: ${order.totalPrice} ${currency}\nالعنوان: ${order.city} - ${order.address}\nهل تؤكد التوصيل؟`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            <span>طلب جديد</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>تم التأكيد</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3" />
            <span>قيد الشحن</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <PackageCheck className="w-3 h-3" />
            <span>تم التسليم</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            <span>ملغى</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Clear Orders */}
      {showClearConfirm && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-rose-900">تأكيد تفريغ كافة الطلبات التجريبية</div>
            <div className="text-[11px] text-rose-700">
              سيتم مسح جميع الطلبات من السجل للبدء من الصفر. هل أنت متأكد؟
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setShowClearConfirm(false);
                if (onClearOrders) onClearOrders();
                showToast('تم مسح كافة الطلبات بنجاح.', 'success');
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              نعم، مسح الكل
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Search, Filter & Export Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="البحث برقم الطلب، اسم العميل، الهاتف، أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-stone-900 text-right"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-700 font-medium cursor-pointer"
            >
              <option value="all">كافة الحالات ({orders.length})</option>
              <option value="new">طلبات جديدة</option>
              <option value="confirmed">تم التأكيد</option>
              <option value="shipping">قيد الشحن</option>
              <option value="delivered">تم التسليم</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onClearOrders && orders.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="تفريغ كافة الطلبات التجريبية للبدء من 0"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>تفريغ الطلبات التجريبية</span>
            </button>
          )}

          {/* Sync All to Sheets */}
          {googleSheetsWebhookUrl && orders.length > 0 && (
            <button
              onClick={handleBulkSync}
              disabled={isBulkSyncing}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="مزامنة كل الطلبات غير المسجلة إلى Google Sheets"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin' : ''}`} />
              <span>{isBulkSyncing ? 'جاري المزامنة...' : 'مزامنة للـ Sheet'}</span>
            </button>
          )}

          {/* CSV Export Button */}
          <button
            onClick={() => exportOrdersToCSV(orders, currency)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير الطلبات (Excel / CSV)</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <PackageCheck className="w-12 h-12 mx-auto stroke-1 mb-2 text-stone-300" />
            <p className="text-sm font-semibold">لا توجد طلبات تطابق هذا البحث أو الفلتر.</p>
            <p className="text-xs text-stone-400 mt-1">
              عندما يقوم أي زبون بالطلب، ستظهر بياناته هنا وفوراً في جدول Google Sheet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم الطلب / التاريخ</th>
                  <th className="py-3 px-4">العميل / الهاتف</th>
                  <th className="py-3 px-4">المدينة والعنوان</th>
                  <th className="py-3 px-4">تفاصيل المنتج والخيارات</th>
                  <th className="py-3 px-4">المبلغ الإجمالي</th>
                  <th className="py-3 px-4">حالة الطلب</th>
                  <th className="py-3 px-4">Google Sheets</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Order Number & Date */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-stone-900 text-xs">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('ar-MA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Customer & Phone */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-stone-900 text-xs">{order.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5" dir="ltr">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{order.phone}</span>
                      </div>
                    </td>

                    {/* City & Address */}
                    <td className="py-3.5 px-4 align-top max-w-[200px]">
                      <div className="font-semibold text-stone-900 flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{order.city}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {order.address}
                      </div>
                    </td>

                    {/* Product & Variant Details */}
                    <td className="py-3.5 px-4 align-top max-w-[240px]">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="mb-1.5 last:mb-0">
                          <div className="font-semibold text-stone-900 text-xs">
                            {item.productName}{' '}
                            <span className="text-stone-400 font-mono text-[11px]">(x{item.quantity})</span>
                          </div>
                          <div className="text-[11px] text-stone-500 flex flex-wrap gap-1 mt-0.5">
                            {item.selectedSize && (
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">
                                مقاس: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">
                                لون: {item.selectedColor}
                              </span>
                            )}
                            {item.customizations && item.customizations.map((c, cIdx) => (
                              <span key={cIdx} className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                                {c.title}: {c.value}
                              </span>
                            ))}
                            {item.selectedPriceCustomizations && item.selectedPriceCustomizations.map((pc, pcIdx) => (
                              <span key={pcIdx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {pc.name} (+{pc.priceDelta})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {order.notes && (
                        <div className="text-[10px] text-stone-400 mt-1 italic border-t border-stone-100 pt-1 line-clamp-2">
                          {order.notes}
                        </div>
                      )}
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-stone-900 text-xs whitespace-nowrap">
                        {order.totalPrice} {currency}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">توصيل مجاني</div>
                    </td>

                    {/* Order Status Select */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <div>{getStatusBadge(order.status)}</div>
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="text-[11px] border border-stone-200 rounded px-1.5 py-0.5 bg-white text-stone-700 cursor-pointer hover:border-stone-400"
                        >
                          <option value="new">طلب جديد</option>
                          <option value="confirmed">تم التأكيد</option>
                          <option value="shipping">قيد الشحن</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">ملغى</option>
                        </select>
                      </div>
                    </td>

                    {/* Google Sheets Sync status */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            order.syncedToGoogleSheets ? 'text-emerald-700' : 'text-stone-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              order.syncedToGoogleSheets ? 'bg-emerald-500' : 'bg-stone-300'
                            }`}
                          />
                          {order.syncedToGoogleSheets ? 'متزامن في الشيت' : 'غير متزامن'}
                        </span>

                        <button
                          onClick={() => handleManualSync(order)}
                          disabled={syncingOrderId === order.id}
                          className="text-[10px] text-stone-600 hover:text-stone-900 underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-2.5 h-2.5 ${syncingOrderId === order.id ? 'animate-spin' : ''}`}
                          />
                          <span>{order.syncedToGoogleSheets ? 'إعادة الإرسال للشيت' : 'مزامنة لـ Sheet'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <button
                        onClick={() => handleOpenCustomerWhatsApp(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                        title="مراسلة وتأكيد الطلب مع العميل على واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>واتساب العميل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
