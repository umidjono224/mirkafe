import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllOrders, OrderStatus } from '@/hooks/useOrders';
import { useProducts, Category, Product } from '@/hooks/useProducts';
import { useOrderStats } from '@/hooks/useOrderStats';
import { usePromotions, Promotion } from '@/hooks/usePromotions';
import { useAdminNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, formatPhone } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Truck, CheckCircle, ExternalLink, Package, TrendingUp, DollarSign, Plus, Pencil, Trash2, Upload, X, Image, FolderPlus, ChevronUp, ChevronDown, Users, Megaphone, Send } from 'lucide-react';

const ADMIN_LOGIN = 'Jumamirkafe';
const ADMIN_PASSWORD = 'Bmirkafejuma';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; className: string }> = {
  tayyorlanmoqda: { label: 'Tayyorlanmoqda', icon: Clock, className: 'status-preparing' },
  yetkazilmoqda: { label: 'Yetkazilmoqda', icon: Truck, className: 'status-delivering' },
  yetkazildi: { label: 'Yetkazildi', icon: CheckCircle, className: 'status-delivered' },
};

interface ProductFormData {
  name: string;
  price: string;
  category_id: string;
  is_available: boolean;
  image_url: string | null;
}

const initialFormData: ProductFormData = {
  name: '',
  price: '',
  category_id: '',
  is_available: true,
  image_url: null,
};

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'aksiyalar' | 'stats'>('orders');
  
  const { orders, loading: ordersLoading, updateOrderStatus } = useAllOrders();
  const { products, categories, loading: productsLoading, refetch: refetchProducts, createCategory, deleteCategory, reorderCategories } = useProducts();
  const { stats, loading: statsLoading, refetch: refetchStats } = useOrderStats();
  const { promotions, loading: promotionsLoading, createPromotion, deletePromotion, refetch: refetchPromotions } = usePromotions();
  const { sendNotification, sending: sendingNotification } = useAdminNotifications();

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Promotion form state
  const promotionFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPromotion, setIsUploadingPromotion] = useState(false);
  
  // Notification state
  const [notificationText, setNotificationText] = useState('');

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

  // Open add product form
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      ...initialFormData,
      category_id: categories[0]?.id || '',
    });
    setShowProductForm(true);
  };

  // Open edit product form
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || categories[0]?.id || '',
      is_available: product.is_available,
      image_url: product.image_url,
    });
    setShowProductForm(true);
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu mahsulotni o\'chirmoqchimisiz?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      refetchProducts();
      toast.success('Mahsulot o\'chirildi');
    } catch (err: any) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  // Create category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategoriya nomini kiriting');
      return;
    }

    setIsSavingCategory(true);
    try {
      await createCategory(newCategoryName.trim());
      toast.success('Kategoriya qo\'shildi');
      setNewCategoryName('');
      setShowCategoryForm(false);
    } catch (err: any) {
      toast.error('Xatolik: ' + err.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`"${categoryName}" kategoriyasini o'chirmoqchimisiz?`)) return;
    
    try {
      await deleteCategory(categoryId);
      toast.success('Kategoriya o\'chirildi');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Move category up
  const handleMoveCategoryUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    try {
      await reorderCategories(newOrder.map(c => c.id));
      toast.success('Tartib yangilandi');
    } catch {
      toast.error('Xatolik');
    }
  };

  // Move category down
  const handleMoveCategoryDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    try {
      await reorderCategories(newOrder.map(c => c.id));
      toast.success('Tartib yangilandi');
    } catch {
      toast.error('Xatolik');
    }
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllari qabul qilinadi');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm hajmi 5MB dan katta bo\'lmasligi kerak');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Rasm yuklandi');
    } catch (err: any) {
      toast.error('Rasm yuklashda xatolik: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Save product
  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      toast.error('Mahsulot nomini kiriting');
      return;
    }

    const price = parseInt(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Narxni to\'g\'ri kiriting');
      return;
    }

    if (!formData.category_id) {
      toast.error('Kategoriyani tanlang');
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        price,
        category_id: formData.category_id,
        is_available: formData.is_available,
        image_url: formData.image_url,
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Mahsulot yangilandi');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
        toast.success('Mahsulot qo\'shildi');
      }

      setShowProductForm(false);
      setFormData(initialFormData);
      setEditingProduct(null);
      refetchProducts();
    } catch (err: any) {
      toast.error('Xatolik: ' + err.message);
    } finally {
      setIsSaving(false);
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
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="MirCafe" className="w-16 h-16 rounded-xl object-cover" />
            </div>
            <h1 className="text-xl font-bold mb-4 text-center">Admin Kirish</h1>
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
          <img src="/logo.png" alt="MirCafe" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <div className="flex border-b border-border">
          {['orders', 'products', 'aksiyalar', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              {tab === 'orders' ? 'Buyurtmalar' : tab === 'products' ? 'Mahsulotlar' : tab === 'aksiyalar' ? 'Aksiyalar' : 'Statistika'}
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
          <div className="space-y-4">
            {/* Category Management Section */}
            <div className="bg-card rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Kategoriyalar</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className="text-xs"
                >
                  <FolderPlus className="w-4 h-4 mr-1" />
                  Yangi
                </Button>
              </div>
              
              {showCategoryForm && (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Kategoriya nomi"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="h-10 rounded-lg flex-1"
                  />
                  <Button
                    onClick={handleCreateCategory}
                    disabled={isSavingCategory}
                    className="h-10 px-4"
                  >
                    {isSavingCategory ? '...' : 'Qo\'shish'}
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                {categories.map((cat, index) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm font-medium">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveCategoryUp(index)}
                        disabled={index === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveCategoryDown(index)}
                        disabled={index === categories.length - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Product Button */}
            <Button onClick={handleAddProduct} className="w-full h-12 rounded-xl bg-primary">
              <Plus className="w-5 h-5 mr-2" /> Yangi mahsulot qo'shish
            </Button>
            
            {/* Products List */}
            {productsLoading ? <p>Yuklanmoqda...</p> : products.map((product) => (
              <div key={product.id} className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-primary">{formatPrice(product.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {categories.find(c => c.id === product.category_id)?.name || 'Kategoriyasiz'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={product.is_available ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleAvailability(product.id, product.is_available)}
                      className="text-xs"
                    >
                      {product.is_available ? 'Mavjud' : 'Mavjud emas'}
                    </Button>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'aksiyalar' && (
          <div className="space-y-6">
            {/* Notification Section */}
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Xabar yuborish</h3>
                  <p className="text-xs text-muted-foreground">Barcha foydalanuvchilarga</p>
                </div>
              </div>
              
              <Textarea
                placeholder="Xabar matnini kiriting..."
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                className="mb-3 rounded-xl min-h-[80px]"
              />
              
              <Button
                onClick={async () => {
                  try {
                    await sendNotification(notificationText);
                    setNotificationText('');
                    toast.success('Xabar yuborildi!');
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
                disabled={sendingNotification || !notificationText.trim()}
                className="w-full h-12 rounded-xl bg-primary"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingNotification ? 'Yuborilmoqda...' : 'Xabar yuborish'}
              </Button>
            </div>

            {/* Promotions Section */}
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Aksiya rasmlari</h3>
                <input
                  type="file"
                  accept="image/*"
                  ref={promotionFileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith('image/')) {
                      toast.error('Faqat rasm fayllari qabul qilinadi');
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Rasm hajmi 5MB dan katta bo\'lmasligi kerak');
                      return;
                    }

                    setIsUploadingPromotion(true);
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                      const filePath = `banners/${fileName}`;

                      const { error: uploadError } = await supabase.storage
                        .from('promotions')
                        .upload(filePath, file);

                      if (uploadError) throw uploadError;

                      const { data: { publicUrl } } = supabase.storage
                        .from('promotions')
                        .getPublicUrl(filePath);

                      await createPromotion(publicUrl);
                      toast.success('Aksiya rasmi qo\'shildi!');
                    } catch (err: any) {
                      toast.error('Xatolik: ' + err.message);
                    } finally {
                      setIsUploadingPromotion(false);
                      if (promotionFileInputRef.current) {
                        promotionFileInputRef.current.value = '';
                      }
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => promotionFileInputRef.current?.click()}
                  disabled={isUploadingPromotion}
                  className="text-xs"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {isUploadingPromotion ? 'Yuklanmoqda...' : 'Rasm qo\'shish'}
                </Button>
              </div>

              {promotionsLoading ? (
                <p className="text-center text-muted-foreground py-4">Yuklanmoqda...</p>
              ) : promotions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aksiya rasmlari yo'q</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="relative group">
                      <img
                        src={promo.image_url}
                        alt={promo.title || 'Aksiya'}
                        className="w-full aspect-[16/9] object-cover rounded-xl"
                      />
                      <button
                        onClick={async () => {
                          if (!confirm('Bu aksiya rasmini o\'chirmoqchimisiz?')) return;
                          try {
                            await deletePromotion(promo.id);
                            toast.success('Aksiya rasmi o\'chirildi');
                          } catch (err: any) {
                            toast.error('Xatolik: ' + err.message);
                          }
                        }}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Today's orders - from persistent stats */}
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bugun yetkazildi</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : stats.todayOrders}</p>
              </div>
            </div>
            
            {/* Today's revenue - from persistent stats */}
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bugungi daromad</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : formatPrice(stats.todayRevenue)}</p>
              </div>
            </div>
            
            {/* Total orders - all time */}
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami buyurtmalar</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : stats.totalOrders}</p>
              </div>
            </div>
            
            {/* Total revenue - all time */}
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami daromad</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
            
            {/* Total users */}
            <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ro'yxatdan o'tganlar</p>
                <p className="text-2xl font-bold">{statsLoading ? '...' : stats.totalUsers}</p>
              </div>
            </div>
            
            {/* Most popular product */}
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

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-end" onClick={() => setShowProductForm(false)}>
          <div
            className="w-full bg-card rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </h2>
              <button onClick={() => setShowProductForm(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Rasm</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="Preview" className="w-32 h-32 rounded-xl object-cover" />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: null }))}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-24 rounded-xl border-dashed"
                  >
                    {isUploading ? (
                      <span>Yuklanmoqda...</span>
                    ) : (
                      <span className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6" />
                        <span>Rasm yuklash</span>
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Nomi</label>
                <Input
                  placeholder="Mahsulot nomi"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-2">Narxi (so'm)</label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Kategoriya</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-input bg-background px-3"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mavjud</label>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_available: !prev.is_available }))}
                  className={`w-12 h-6 rounded-full transition-colors ${formData.is_available ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.is_available ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <Button
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-fire text-primary-foreground mt-4"
              >
                {isSaving ? 'Saqlanmoqda...' : (editingProduct ? 'Saqlash' : 'Qo\'shish')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
