import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import NotificationToast from "@/components/NotificationToast";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import IOSInstallPrompt from "@/components/IOSInstallPrompt";
import Register from "./pages/Register";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading, isRegistered } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-fire animate-pulse" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return <Register />;
  }

  return (
    <>
      <NotificationToast userId={user?.id} />
      <PushNotificationPrompt userId={user?.id} />
      <IOSInstallPrompt />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<Help />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
