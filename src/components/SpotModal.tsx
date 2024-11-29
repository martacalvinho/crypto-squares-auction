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
import { useMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";

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
  const [previousOwner, setPreviousOwner] = useState<any>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();

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
        .select('project_name, wallet_address')
        .eq('id', spotId)
        .single();

      if (spotError) {
        console.error('Error fetching current spot:', spotError);
        throw spotError;
      }

      // Store the previous project name and owner if it exists
      const previousProject = currentSpot?.project_name;
      const previousOwner = currentSpot?.wallet_address;
      setPreviousProjectName(previousProject);
      setPreviousOwner({ wallet_address: previousOwner });

      // Insert into spot history if there was a previous project
      if (previousProject) {
        const { error: historyError } = await supabase
          .from('spot_history')
          .insert({
            spot_id: spotId,
            previous_project_name: previousProject,
            project_name: projectName,
            previous_wallet_owner: previousOwner,
            new_wallet_owner: publicKey.toString(),
            price_paid: purchaseAmount,
            is_steal: true,
            transaction_type: 'steal',
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

  return showSuccess ? (
    <SuccessModal 
      onClose={onClose} 
      spotId={spotId} 
      previousProjectName={previousProjectName}
    />
  ) : (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <p className="text-sm text-gray-500">{modalDescription}</p>
        </DialogHeader>

        {isMobile ? (
          // Mobile Form
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }} className="space-y-3 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., CryptoSquares"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projectLogo">Project Logo</Label>
              <div
                className="relative flex h-24 items-center justify-center rounded-lg border border-dashed hover:cursor-pointer"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {projectLogo ? (
                  <img
                    src={projectLogo}
                    alt="Project Logo"
                    className="h-20 w-20 rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center p-2">
                    <ImagePlus className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-1 text-xs">
                      Upload image
                      <div className="text-[10px] text-gray-500">PNG, JPG, GIF up to 10MB</div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs h-7 mt-1"
              >
                Or use URL
              </Button>
              {showUrlInput && (
                <Input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={projectLogo}
                  onChange={(e) => setProjectLogo(e.target.value)}
                  className="text-xs h-7 mt-1"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projectLink">Project Website</Label>
              <Input
                id="projectLink"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="e.g., cryptosquares.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customPrice">Bid Amount (SOL)</Label>
              <Input
                id="customPrice"
                type="number"
                step="0.01"
                min={minimumBid}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={minimumBid.toString()}
                className="h-9"
              />
              <div className="text-xs text-gray-500">
                Minimum bid: {formatSol(minimumBid)} SOL
              </div>
            </div>

            <Button type="submit" className="w-full h-9 mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : isEmpty ? "Buy Spot" : "Steal Spot"}
            </Button>
          </form>
        ) : (
          // Desktop Form
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., CryptoSquares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectLogo">Project Logo</Label>
              <div
                className="relative flex h-32 items-center justify-center rounded-lg border border-dashed hover:cursor-pointer"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {projectLogo ? (
                  <img
                    src={projectLogo}
                    alt="Project Logo"
                    className="h-28 w-28 rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      Choose file or drag and drop
                      <div className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                >
                  Or use URL
                </Button>
                {showUrlInput && (
                  <Input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={projectLogo}
                    onChange={(e) => setProjectLogo(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectLink">Project Website</Label>
              <Input
                id="projectLink"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="e.g., cryptosquares.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customPrice">Bid Amount (SOL)</Label>
              <Input
                id="customPrice"
                type="number"
                step="0.01"
                min={minimumBid}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={minimumBid.toString()}
              />
              <div className="text-sm text-gray-500">
                Minimum bid: {formatSol(minimumBid)} SOL
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : isEmpty ? "Buy Spot" : "Steal Spot"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};