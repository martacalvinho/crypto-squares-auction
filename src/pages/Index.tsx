import { Grid } from "@/components/Grid";
import { Header } from "@/components/Header";
import { Boost } from "@/components/boost/Boost";
import { MobileDropdown } from "@/components/MobileDropdown";
import { Rocket } from "lucide-react";
import { Plus } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { supabase } from '@/lib/supabase';
import { SpotModal } from '@/components/SpotModal';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

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
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-16 lg:pb-32 flex flex-col lg:flex-row lg:items-center lg:gap-8">
        <div className="flex-1">
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-crypto-primary to-purple-400 bg-clip-text text-transparent">
            Buy a spot in Solana History
          </h1>
          <p className="mt-4 text-lg lg:text-xl text-gray-400">
            Get 1 of 500 exclusive spots to showcase your crypto project
          </p>
          <div className="mt-8 flex flex-row gap-4">
            <Button onClick={handleStartBidding} className="flex-1 lg:flex-none lg:w-auto">
              Start Bidding
            </Button>
            <Button
              onClick={handleBoostProject}
              variant="outline"
              className="flex-1 lg:flex-none lg:w-auto bg-[#1a1d24] hover:bg-[#21242c]"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Boost Your Project
            </Button>
          </div>
        </div>

        {/* Featured Projects - Desktop Only */}
        <div className="hidden lg:block">
          <Card className="w-[400px] bg-[#1a1d24]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-crypto-primary" />
                  <h2 className="text-lg font-semibold">Featured Projects</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-sm text-muted-foreground hover:text-primary"
                    onClick={handleBoostProject}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Boost onOpenBoostDialog={() => setIsBoostDialogOpen(true)} />
            </CardContent>
          </Card>
        </div>
      </div>

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
        <DialogContent>
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