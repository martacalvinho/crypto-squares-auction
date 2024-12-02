import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import MemeWars from "./pages/MemeWars";
import { SolanaWalletProvider } from "./integrations/wallet/WalletProvider";
import { ErrorBoundary } from "react-error-boundary";
import { FallbackComponent } from "./FallbackComponent";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <QueryClientProvider client={queryClient}>
        <SolanaWalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="meme-wars" element={<MemeWars />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </SolanaWalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
