import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateUser, loading } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Ismingizni kiriting');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateUser({ name: name.trim() });
      toast.success('Saqlandi!');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Shaxsiy kabinet</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Ism</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Telefon</label>
            <Input
              value={phone}
              disabled
              className="h-12 rounded-xl bg-muted"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="w-full h-12 rounded-xl bg-primary"
          >
            {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
