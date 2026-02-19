import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useOrders, OrderStatus } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/formatters';
import BottomNav from '@/components/BottomNav';
import { Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; className: string }> = {
  tayyorlanmoqda: { label: 'Tayyorlanmoqda', icon: Clock, className: 'status-preparing' },
  yetkazilmoqda: { label: 'Yetkazilmoqda', icon: Truck, className: 'status-delivering' },
  yetkazildi: { label: 'Yetkazildi', icon: CheckCircle, className: 'status-delivered' },
};

export default function Orders() {
  const { user } = useUser();
  const { orders, loading, cancelOrder } = useOrders(user?.id);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Buyurtmani bekor qilmoqchimisiz?')) return;
    try {
      setCancelingId(orderId);
      await cancelOrder(orderId);
      toast.success('Buyurtma bekor qilindi');
    } catch {
      toast.error('Buyurtmani bekor qilishda xatolik');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Buyurtmalarim</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Buyurtmalar yo'q</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            const canCancel = order.status !== 'yetkazildi';
            return (
              <div key={order.id} className="bg-card rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${status.className}`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </div>
                </div>
                <div className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.product.name} × {item.quantity}</span>
                      <span>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center font-bold">
                  <span>Jami</span>
                  <span className="text-primary">{formatPrice(order.total_amount)}</span>
                </div>
                {canCancel && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={cancelingId === order.id}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {cancelingId === order.id ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
