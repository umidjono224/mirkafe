import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useLocation } from '@/hooks/useLocation';
import { formatPrice } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import PromotionsBanner from '@/components/PromotionsBanner';
import NotificationToast from '@/components/NotificationToast';
import { toast } from 'sonner';
import { MapPin, X, RotateCcw } from 'lucide-react';

export default function Menu() {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { categories, products, loading: productsLoading, getProductsByCategory } = useProducts();
  const { items, addItem, removeItem, getQuantity, total, itemCount, isEmpty, clearCart, saveAsLastOrder, hasLastOrder, loadLastOrder } = useCart();
  const { createOrder } = useOrders(user?.id);
  const { location, loading: locationLoading, permissionDenied, requestLocation } = useLocation();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  // Set first category as active when loaded
  if (!activeCategory && categories.length > 0) {
    setActiveCategory(categories[0].id);
  }

  const filteredProducts = activeCategory ? getProductsByCategory(activeCategory) : products;

  const handleOrder = async () => {
    setShowOrderModal(true);
    await requestLocation();
  };

  const handleReorder = () => {
    if (loadLastOrder()) {
      toast.success('Oxirgi buyurtma yuklandi!');
    }
  };

  const handleConfirmOrder = async () => {
    const address = location?.address || manualAddress;
    
    if (!address.trim()) {
      toast.error('Manzilni kiriting');
      return;
    }

    setIsOrdering(true);
    try {
      await createOrder(items, address, location?.lat, location?.lng);
      
      // Save user's address for future
      if (location) {
        await updateUser({
          last_address: address,
          last_lat: location.lat,
          last_lng: location.lng,
        });
      }
      
      saveAsLastOrder();
      clearCart();
      setShowOrderModal(false);
      toast.success('Buyurtma qabul qilindi!');
      navigate('/orders');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Notification Toast */}
      <NotificationToast userId={user?.id} />
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="MirCafe" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <h1 className="text-xl font-bold text-fire">MirCafe</h1>
                <p className="text-sm text-muted-foreground">Salom, {user?.name}! 👋</p>
              </div>
            </div>
            {hasLastOrder && isEmpty && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReorder}
                className="flex items-center gap-2 rounded-full"
              >
                <RotateCcw className="w-4 h-4" />
                Takrorlash
              </Button>
            )}
          </div>
          
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-tab ${activeCategory === cat.id ? 'category-tab-active' : 'category-tab-inactive'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Promotions Banner - Only shows if promotions exist */}
      <PromotionsBanner />

      {/* Products grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantity(product.id)}
            onAdd={() => addItem(product)}
            onRemove={() => removeItem(product.id)}
          />
        ))}
      </div>

      {/* Sticky order button */}
      <AnimatePresence>
        {!isEmpty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="sticky-order-btn"
          >
            <Button
              onClick={handleOrder}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-fire text-primary-foreground shadow-float"
            >
              Buyurtma berish · {formatPrice(total)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order modal */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-end justify-center"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl p-6 pb-8"
              style={{ 
                maxHeight: '75vh',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Yetkazib berish</h2>
                <button onClick={() => setShowOrderModal(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Order summary */}
              <div className="mb-4 p-4 bg-muted rounded-2xl">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">{itemCount} ta mahsulot</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">Manzil</span>
                </div>
                
                {locationLoading ? (
                  <div className="p-4 bg-muted rounded-2xl text-center">
                    <div className="animate-pulse">Joylashuv aniqlanmoqda...</div>
                  </div>
                ) : location ? (
                  <div className="p-4 bg-muted rounded-2xl">
                    <p className="text-sm">{location.address}</p>
                  </div>
                ) : (
                  <Input
                    placeholder="Manzilingizni kiriting"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="h-14 rounded-2xl"
                  />
                )}
              </div>

              {/* Confirm button - always visible */}
              <Button
                onClick={handleConfirmOrder}
                disabled={isOrdering || (!location && !manualAddress.trim())}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-fire text-primary-foreground"
              >
                {isOrdering ? 'Yuborilmoqda...' : 'Tasdiqlash'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
