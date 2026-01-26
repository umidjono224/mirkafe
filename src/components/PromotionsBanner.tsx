import { usePromotions } from '@/hooks/usePromotions';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

export default function PromotionsBanner() {
  const { promotions, hasPromotions, loading } = usePromotions();
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  // Don't render anything if no promotions exist
  if (loading || !hasPromotions) {
    return null;
  }

  return (
    <div className="px-4 pt-4">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          align: 'start',
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2">
          {promotions.map((promo) => (
            <CarouselItem key={promo.id} className="pl-2 basis-[90%]">
              <div className="relative aspect-[16/7] overflow-hidden rounded-2xl">
                <img
                  src={promo.image_url}
                  alt={promo.title || 'Aksiya'}
                  className="w-full h-full object-cover"
                />
                {promo.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white font-semibold text-lg">{promo.title}</p>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
