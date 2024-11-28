import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { useAccount } from "@/integrations/wallet/use-account";
import { useWallet } from '@solana/wallet-adapter-react';
import { sendPayment } from '@/integrations/wallet/transaction';
import { getMinimumBid, formatSol } from '@/lib/price';
import { SuccessModal } from "./SuccessModal";
import { formatUrl } from "@/lib/url";

interface SpotModalProps {
  spotId: number;
  onClose: () => void;
  isConnected: boolean;
  currentPrice: number;
  isEmpty: boolean;
}

export const SpotModal = ({ spotId, onClose, isConnected, currentPrice, isEmpty }: SpotModalProps) => {
  const { publicKey, signTransaction, connected, connecting, select } = useWallet();
  const [projectName, setProjectName] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectLogo, setProjectLogo] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousProjectName, setPreviousProjectName] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Ensure wallet is ready
  useEffect(() => {
    if (!connected && !connecting) {
      select('phantom');
    }
  }, [connected, connecting, select]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProjectLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const minimumBid = getMinimumBid(currentPrice, isEmpty);
  const purchaseAmount = Number(customPrice) || minimumBid;

  const modalTitle = isEmpty ? "Buy Empty Spot" : "Steal This Spot";
  const modalDescription = isEmpty 
    ? `Buy this spot for ${formatSol(minimumBid)} SOL`
    : `Current spot price: ${formatSol(currentPrice)} SOL`;

  const handleSubmit = async () => {
    if (!connected || !publicKey || !signTransaction) {
      try {
        await select('phantom');
        toast({
          title: "Wallet Connection",
          description: "Please approve the connection request in Phantom",
        });
      } catch (error) {
        toast({
          title: "Wallet Error",
          description: "Failed to connect to Phantom wallet",
          variant: "destructive",
        });
      }
      return;
    }

    if (!projectName || !projectLink) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Format the project link
    const formattedProjectLink = projectLink ? formatUrl(projectLink) : null;

    if (purchaseAmount < minimumBid) {
      toast({
        title: "Invalid Bid",
        description: `Minimum bid must be ${formatSol(minimumBid)} SOL`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Basic URL validation
      try {
        if (formattedProjectLink) new URL(formattedProjectLink);
        if (projectLogo) new URL(projectLogo);
      } catch {
        throw new Error("Please enter valid URLs");
      }

      // Check if project name already exists
      const { data: existingProject } = await supabase
        .from('spots')
        .select('id, project_name')
        .eq('project_name', projectName)
        .single();

      if (existingProject) {
        const confirmed = window.confirm(
          `This project already exists in spot #${existingProject.id + 1}. Are you sure you want to claim another spot?`
        );
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }

      console.log('Initiating payment of', purchaseAmount, 'SOL');
      const signature = await sendPayment(purchaseAmount, publicKey, signTransaction);
      console.log('Payment sent, signature:', signature);

      // Update database only after successful payment
      await updateDatabase(signature);
      
      toast({
        title: "Success",
        description: "Payment sent and spot claimed successfully!",
      });

      queryClient.invalidateQueries(['spots']);
      queryClient.invalidateQueries(['activities']);
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      if (error.name === 'WalletNotConnectedError') {
        toast({
          title: "Wallet Error",
          description: "Please reconnect your wallet and try again",
          variant: "destructive",
        });
      } else if (error.message?.includes('insufficient balance')) {
        toast({
          title: "Insufficient Balance",
          description: "Please add more SOL to your wallet",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDatabase = async (signature: string) => {
    try {
      // First get the current spot data
      const { data: currentSpot, error: spotError } = await supabase
        .from('spots')
        .select('project_name')
        .eq('id', spotId)
        .single();

      if (spotError) {
        console.error('Error fetching current spot:', spotError);
        throw spotError;
      }

      // Store the previous project name if it exists
      const previousProject = currentSpot?.project_name;
      setPreviousProjectName(previousProject);

      // Insert into spot history if there was a previous project
      if (previousProject) {
        const { error: historyError } = await supabase
          .from('spot_history')
          .insert({
            spot_id: spotId,
            previous_project_name: previousProject,
            project_name: projectName,
            timestamp: new Date().toISOString()
          });

        if (historyError) {
          console.error('Error inserting spot history:', historyError);
          throw historyError;
        }
      }

      // Format the project link
      const formattedProjectLink = projectLink ? formatUrl(projectLink) : null;

      // Update the spot
      const { error: updateError } = await supabase
        .from('spots')
        .update({
          project_name: projectName,
          project_link: formattedProjectLink,
          project_logo: projectLogo,
          current_bid: purchaseAmount,
          wallet_address: publicKey.toString(),
          last_transaction: signature,
          updated_at: new Date().toISOString()
        })
        .eq('id', spotId);

      if (updateError) {
        console.error('Error updating spot:', updateError);
        throw updateError;
      }

      console.log('Successfully updated spot and history:', {
        spotId,
        previousProject,
        newProject: projectName,
        timestamp: new Date().toISOString()
      });

      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating database:', error);
      throw error;
    }
  };

  return (
    <>
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground">{modalDescription}</p>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                placeholder="Enter your project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Project Link *</Label>
              <Input
                placeholder="https://... "
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Project Logo</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragging ? "border-crypto-primary bg-crypto-primary/10" : "border-crypto-primary/20 hover:border-crypto-primary/40",
                  "relative"
                )}
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-400">
                    Drag and drop an image here, or click to select
                  </p>
                </div>
                {projectLogo && (
                  <div className="mt-4">
                    <img
                      src={projectLogo}
                      alt="Logo preview"
                      className="max-h-32 mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setShowUrlInput(!showUrlInput)}
              >
                {showUrlInput ? "Hide URL input" : "Use image URL instead"}
              </Button>

              {showUrlInput && (
                <Input
                  placeholder="https://... (image URL)"
                  value={projectLogo}
                  onChange={(e) => setProjectLogo(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Purchase Amount (SOL)</Label>
              <Input
                type="number"
                step="0.001"
                min={minimumBid}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={`Min: ${formatSol(minimumBid)} SOL`}
              />
              <div className="text-sm text-gray-400">
                Minimum bid: {formatSol(minimumBid)} SOL
                {currentPrice >= 1 ? " (10% above current price)" : " (0.05 SOL above current price)"}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !connected}
            >
              {isSubmitting ? "Claiming..." : "Claim Spot"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {showSuccess && (
        <SuccessModal
          spotId={spotId}
          projectName={projectName}
          previousProjectName={previousProjectName}
          onClose={() => {
            setShowSuccess(false);
            onClose();
          }}
        />
      )}
    </>
  );
};