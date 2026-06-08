import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/hooks/useNotifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Explore from "./pages/Explore";
import BarDetail from "./pages/BarDetail";
import Networking from "./pages/Networking";
import Chat from "./pages/Chat";
import ChatRoom from "./pages/ChatRoom";
import MyPage from "./pages/MyPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/bar/:id" element={<BarDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/networking" element={<ProtectedRoute><Networking /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
              <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
