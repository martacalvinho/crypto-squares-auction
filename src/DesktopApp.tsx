import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SolanaWalletProvider } from "./integrations/wallet/WalletProvider";
import { Header } from "@/components/Header";
import { Grid } from "@/components/Grid";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Hero } from "@/components/Hero";

const queryClient = new QueryClient();

export const DesktopApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-[#0D0F1A] text-white">
            <Header />
            <main className="container mx-auto px-4 py-8 space-y-8">
              <Hero />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                <div className="space-y-8">
                  <Grid />
                </div>
                <div className="space-y-8">
                  <ActivityFeed />
                </div>
              </div>
            </main>
            <Toaster />
            <Sonner />
          </div>
        </TooltipProvider>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
};
