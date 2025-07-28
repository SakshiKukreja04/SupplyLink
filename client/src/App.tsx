import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { AppProvider } from "@/contexts/AppContext";
import PrivateRoute from "@/components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierDetails from "./pages/SupplierDetails";
import VendorDashboard from "./pages/VendorDashboard";
import VoiceSearchDemo from "./pages/VoiceSearchDemo";
import NotFound from "./pages/NotFound";
import { debugEnvironment } from "./utils/debug-env";

const queryClient = new QueryClient();

// Debug environment variables on app start
debugEnvironment();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route 
                  path="/supplier-dashboard" 
                  element={
                    <PrivateRoute requiredRole="supplier">
                      <SupplierDashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/supplier-dashboard/details" 
                  element={
                    <PrivateRoute requiredRole="supplier">
                      <SupplierDetails />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/vendor-dashboard" 
                  element={
                    <PrivateRoute requiredRole="vendor">
                      <VendorDashboard />
                    </PrivateRoute>
                  } 
                />
                <Route path="/voice-search-demo" element={<VoiceSearchDemo />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
