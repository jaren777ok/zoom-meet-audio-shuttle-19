import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AIMessagesProvider } from "@/contexts/AIMessagesContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import CompanyProtectedRoute from "@/components/CompanyProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Knowledge from "./pages/Knowledge";
import Sessions from "./pages/Sessions";
import Analytics from "./pages/Analytics";
import CompanyDashboard from "./pages/CompanyDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <AIMessagesProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/knowledge" element={
                <ProtectedRoute>
                  <Knowledge />
                </ProtectedRoute>
              } />
              <Route path="/sessions" element={
                <ProtectedRoute>
                  <Sessions />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/analytics/:sessionId" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/company" element={
                <CompanyProtectedRoute>
                  <CompanyDashboard />
                </CompanyProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AIMessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
