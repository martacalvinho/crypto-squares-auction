import { Grid } from "@/components/Grid";
import { Header } from "@/components/Header";
import { MobileDropdown } from "@/components/MobileDropdown";
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { supabase } from '@/lib/supabase';
import { SpotModal } from '@/components/SpotModal';
import { DesktopHero } from '@/components/hero/DesktopHero';
import { MobileHero } from '@/components/hero/MobileHero';
import cn from 'classnames';

const Index = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const [isBoostDialogOpen, setIsBoostDialogOpen] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);

  const handleStartBidding = async () => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to start bidding",
        variant: "destructive"
      });
      return;
    }

    // Get all spots
    const { data: spots, error } = await supabase
      .from('spots')
      .select('id, project_name, current_bid')
      .order('id');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch spots",
        variant: "destructive"
      });
      return;
    }

    if (!spots || spots.length === 0) {
      toast({
        title: "Error",
        description: "No spots available in the grid",
        variant: "destructive"
      });
      return;
    }

    // Pick a random spot from all spots
    const randomIndex = Math.floor(Math.random() * spots.length);
    const randomSpot = spots[randomIndex];
    
    // Set the selected spot and open the modal
    setSelectedSpotId(randomSpot.id);
    setIsSpotModalOpen(true);
  };

  const handleCloseSpotModal = () => {
    setIsSpotModalOpen(false);
    setSelectedSpotId(null);
  };

  const handleBoostProject = () => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to boost your project",
        variant: "destructive"
      });
      return;
    }

    setIsBoostDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-crypto-dark">
      <Header />
      
      {/* Hero Sections */}
      <DesktopHero 
        onStartBidding={handleStartBidding}
        onBoostProject={handleBoostProject}
        onOpenBoostDialog={() => setIsBoostDialogOpen(true)}
      />
      <MobileHero 
        onStartBidding={handleStartBidding}
        onBoostProject={handleBoostProject}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4">
        <MobileDropdown />
        <Grid />
        {selectedSpotId !== null && isSpotModalOpen && (
          <SpotModal
            spotId={selectedSpotId}
            onClose={handleCloseSpotModal}
            isConnected={connected}
            currentPrice={0}
          />
        )}
      </main>

      {/* Boost Dialog */}
      <Dialog open={isBoostDialogOpen} onOpenChange={setIsBoostDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-lg",
          "w-[90%] h-auto"
        )}>
          <DialogHeader>
            <DialogTitle>Boost Your Project</DialogTitle>
          </DialogHeader>
          <BoostSubmissionForm onSuccess={() => setIsBoostDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;