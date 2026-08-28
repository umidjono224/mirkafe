import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useLocation } from '@/hooks/useLocation';
import { formatPrice } from '@/lib/formatters';
import { isWithinBusinessHours, getClosedMessage } from '@/lib/businessHours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import PromotionsBanner from '@/components/PromotionsBanner';
import NotificationToast from '@/components/NotificationToast';
import { toast } from 'sonner';
import { MapPin, X, RotateCcw, Clock, MessageSquare } from 'lucide-react';

export default function Menu() {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { categories, products, loading: productsLoading, getProductsByCategory } = useProducts();
  const { items, addItem, removeItem, getQuantity, total, itemCount, isEmpty, clearCart, saveAsLastOrder, hasLastOrder, loadLastOrder } = useCart();
  const { createOrder } = useOrders(user?.id);
  const { location, loading: locationLoading, permissionDenied, requestLocation } = useLocation();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Check business hours on each render for button state
  const isOpen = isWithinBusinessHours();

  // Set first category as active when loaded
  if (!activeCategory && categories.length > 0) {
    setActiveCategory(categories[0].id);
  }

  const filteredProducts = activeCategory ? getProductsByCategory(activeCategory) : products;

  const handleOrder = async () => {
    // Check business hours instantly on button click
    if (!isWithinBusinessHours()) {
      setShowClosedModal(true);
      return;
    }
    
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
      await createOrder(items, address, location?.lat, location?.lng, orderNotes);
      
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
      setOrderNotes('');
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
              className={`w-full h-14 text-lg font-semibold rounded-2xl bg-fire text-primary-foreground shadow-float ${!isOpen ? 'opacity-70' : ''}`}
            >
              Buyurtma berish · {formatPrice(total)}
            </Button>
            {!isOpen && (
              <p className="text-center text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                Hozir yopiq
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order modal - centered */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-3xl flex flex-col shadow-float"
              style={{ maxHeight: '80vh' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <h2 className="text-xl font-bold">Yetkazib berish</h2>
                <button onClick={() => setShowOrderModal(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6">
                {/* Order summary */}
                <div className="mb-4 p-4 bg-muted rounded-2xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">{itemCount} ta mahsulot</span>
                    <span className="font-bold">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4">
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

                {/* Order notes */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="font-medium">Izoh (ixtiyoriy)</span>
                  </div>
                  <Input
                    placeholder="Masalan: achchiq bo'lmasin"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="h-14 rounded-2xl"
                  />
                </div>
              </div>

              {/* Confirm button - always visible */}
              <div className="flex-shrink-0 p-6 pt-4">
                <Button
                  onClick={handleConfirmOrder}
                  disabled={isOrdering || (!location && !manualAddress.trim())}
                  className="w-full h-14 text-lg font-semibold rounded-2xl bg-fire text-primary-foreground"
                >
                  {isOrdering ? 'Yuborilmoqda...' : 'Tasdiqlash'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Business hours closed modal */}
      <AnimatePresence>
        {showClosedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
            onClick={() => setShowClosedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-float text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-fire" />
              </div>
              <p className="text-base mb-6">
                {getClosedMessage()}
              </p>
              <Button
                onClick={() => setShowClosedModal(false)}
                className="w-full h-12 text-base font-semibold rounded-2xl bg-fire text-primary-foreground"
              >
                Tushunarli
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
