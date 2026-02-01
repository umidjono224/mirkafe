import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { Phone } from 'lucide-react';

export default function Help() {
  const navigate = useNavigate();
  const [tapCount, setTapCount] = useState(0);

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount >= 5) {
      navigate('/admin');
      setTapCount(0);
    }

    // Reset count after 2 seconds
    setTimeout(() => setTapCount(0), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Yordam</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-card rounded-2xl p-6 shadow-card text-center">
          <div 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-fire flex items-center justify-center cursor-pointer"
            onClick={handleLogoTap}
          >
            <span className="text-3xl font-bold text-primary-foreground">M</span>
          </div>
          <h2 className="text-xl font-bold mb-2">MirCafe</h2>
          <p className="text-muted-foreground mb-6">Savol yoki takliflar uchun biz bilan bog'laning</p>
          
          <a href="tel:+998700112999">
            <Button className="w-full h-14 rounded-2xl bg-fire text-primary-foreground text-lg font-semibold">
              <Phone className="w-5 h-5 mr-2" />
              +998 70 011 29 99
            </Button>
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
