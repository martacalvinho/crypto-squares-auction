import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SolanaWalletProvider } from "./integrations/wallet/WalletProvider";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import './mobile.css';

const queryClient = new QueryClient();

export const MobileApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <div className="min-h-screen bg-[#0D0F1A] text-white">
          <MobileLayout />
        </div>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
};
