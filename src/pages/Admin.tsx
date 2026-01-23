import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllOrders, OrderStatus } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, formatPhone } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Truck, CheckCircle, ExternalLink, Package, TrendingUp, DollarSign } from 'lucide-react';

const ADMIN_LOGIN = 'Jumamirkafe';
const ADMIN_PASSWORD = 'Bmirkafejuma';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; className: string }> = {
  tayyorlanmoqda: { label: 'Tayyorlanmoqda', icon: Clock, className: 'status-preparing' },
  yetkazilmoqda: { label: 'Yetkazilmoqda', icon: Truck, className: 'status-delivering' },
  yetkazildi: { label: 'Yetkazildi', icon: CheckCircle, className: 'status-delivered' },
};

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'stats'>('orders');
  
  const { orders, loading: ordersLoading, updateOrderStatus } = useAllOrders();
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();

  const handleLogin = () => {
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Kirish muvaffaqiyatli!');
    } else {
      toast.error('Login yoki parol xato');
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success('Status yangilandi');
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  const toggleAvailability = async (productId: string, isAvailable: boolean) => {
    try {
      await supabase.from('products').update({ is_available: !isAvailable }).eq('id', productId);
      refetchProducts();
      toast.success(isAvailable ? 'O\'chirildi' : 'Yoqildi');
    } catch {
      toast.error('Xatolik');
    }
  };

  // Stats
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const popularProduct = orders.flatMap(o => o.items).reduce((acc, item) => {
    acc[item.product.name] = (acc[item.product.name] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);
  const topProduct = Object.entries(popularProduct).sort((a, b) => b[1] - a[1])[0];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Button variant="ghost" onClick={() => navigate('/help')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga
          </Button>
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <h1 className="text-xl font-bold mb-4">Admin Kirish</h1>
            <div className="space-y-3">
              <Input placeholder="Login" value={login} onChange={(e) => setLogin(e.target.value)} className="h-12 rounded-xl" />
              <Input type="password" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
              <Button onClick={handleLogin} className="w-full h-12 rounded-xl bg-primary">Kirish</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/help')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <div className="flex border-b border-border">
          {['orders', 'products', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              {tab === 'orders' ? 'Buyurtmalar' : tab === 'products' ? 'Mahsulotlar' : 'Statistika'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? <p>Yuklanmoqda...</p> : orders.length === 0 ? <p className="text-muted-foreground">Buyurtmalar yo'q</p> : orders.map((order) => {
              const status = statusConfig[order.status];
              return (
                <div key={order.id} className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold">{order.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPhone(order.user?.phone_number || '')}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString('uz-UZ')}</span>
                  </div>
                  <div className="mb-3 text-sm">
                    {order.items.map((item, i) => <div key={i}>{item.product.name} × {item.quantity}</div>)}
                  </div>
                  <div className="mb-3 p-2 bg-muted rounded-lg text-sm">
                    📍 {order.address_lat && order.address_lng ? (
                      <a href={`https://www.google.com/maps?q=${order.address_lat},${order.address_lng}`} target="_blank" className="text-primary underline flex items-center gap-1">
                        Xaritada ko'rish <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : order.address}
                  </div>
                  <div className="flex gap-2">
                    {(['tayyorlanmoqda', 'yetkazilmoqda', 'yetkazildi'] as OrderStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(order.id, s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border ${order.status === s ? statusConfig[s].className : 'bg-muted/50 text-muted-foreground'}`}
                      >
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-3">
            {productsLoading ? <p>Yuklanmoqda...</p> : products.map((product) => (
              <div key={product.id} className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-primary">{formatPrice(product.price)}</p>
                </div>
                <Button
                  variant={product.is_available ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAvailability(product.id, product.is_available)}
                >
                  {product.is_available ? 'Mavjud' : 'Mavjud emas'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bugun buyurtmalar</p>
                <p className="text-2xl font-bold">{todayOrders.length}</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bugungi daromad</p>
                <p className="text-2xl font-bold">{formatPrice(todayRevenue)}</p>
              </div>
            </div>
            {topProduct && (
              <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Eng mashhur</p>
                  <p className="text-lg font-bold">{topProduct[0]}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
