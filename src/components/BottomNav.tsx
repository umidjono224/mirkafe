import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, User, HelpCircle } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Asosiy' },
  { path: '/orders', icon: ShoppingBag, label: 'Buyurtmalarim' },
  { path: '/profile', icon: User, label: 'Kabinet' },
  { path: '/help', icon: HelpCircle, label: 'Yordam' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
