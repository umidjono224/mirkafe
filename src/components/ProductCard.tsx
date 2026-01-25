import { motion } from 'framer-motion';
import { Product } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/formatters';
import { Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function ProductCard({ product, quantity, onAdd, onRemove }: ProductCardProps) {
  return (
    <motion.div
      layout
      className="product-card"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">🍔</span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 break-words">{product.name}</h3>
        <p className="text-primary font-bold text-sm">{formatPrice(product.price)}</p>
        
        {/* Quantity controls */}
        <div className="mt-3 flex items-center justify-between">
          {quantity > 0 ? (
            <>
              <button
                onClick={onRemove}
                className="qty-btn qty-btn-minus haptic"
              >
                <Minus className="w-4 h-4" />
              </button>
              <motion.span
                key={quantity}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-bold text-lg"
              >
                {quantity}
              </motion.span>
              <button
                onClick={onAdd}
                className="qty-btn qty-btn-plus haptic"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onAdd}
              className="w-full h-10 rounded-full bg-primary text-primary-foreground font-medium text-sm haptic flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Qo'shish
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
