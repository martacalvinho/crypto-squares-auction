import * as React from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus, Rocket, ExternalLink, Clock, Globe, Send, LineChart, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { BoostSlotDetails } from '@/components/boost/BoostSlotDetails';
import { formatTimeLeft } from './BoostUtils';
import { useBoostSlots } from '@/hooks/useBoostSlots';
import cn from 'classnames';
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobileFeaturedProps {
  onClose: () => void;
}

export const MobileFeatured = ({ onClose }: MobileFeaturedProps) => {
  const { data: boostData } = useBoostSlots();
  const { connected } = useWallet();
  const { toast } = useToast();
  const [slots, setSlots] = useState<any[]>([]);
  const [waitlistProjects, setWaitlistProjects] = useState<any[]>([]);
  const [isBoostDialogOpen, setIsBoostDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [isSlotDetailsOpen, setIsSlotDetailsOpen] = useState(false);

  useEffect(() => {
    if (boostData) {
      setSlots(boostData.slots);
      setWaitlistProjects(boostData.waitlist);
    }
  }, [boostData]);

  const handleOpenBoostDialog = (slotNumber: number) => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to boost a project",
        variant: "destructive"
      });
      return;
    }
    setIsBoostDialogOpen(true);
  };

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setIsSlotDetailsOpen(true);
  };

  const handleContributeFromDetails = () => {
    setIsSlotDetailsOpen(false);
    setIsBoostDialogOpen(true);
  };

  // Calculate time progress
  const calculateTimeProgress = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  // Create array of 5 slots
  const slotsArray = [...(slots || [])];
  while (slotsArray.length < 5) {
    slotsArray.push(null);
  }

  return (
    <div className="flex flex-col w-full gap-3 p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Featured Projects</span>
        </div>
        <Button
          onClick={() => handleOpenBoostDialog(0)}
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
        >
          + Add Project
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {slotsArray.map((slot, index) => (
          <div
            key={index}
            className="flex flex-col bg-background/90 rounded-lg border border-border/50 p-3"
          >
            {slot ? (
              <>
                <div className="flex items-center gap-4">
                  <img
                    src={slot.project_logo}
                    alt={slot.project_name}
                    width={32}
                    height={32}
                    className="rounded-md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{slot.project_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeLeft(slot.end_time)}
                      </span>
                    </div>
                    <Progress value={calculateTimeProgress(slot.start_time, slot.end_time)} className="h-1 mt-1.5" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1.5">
                    {slot.project_link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(slot.project_link, '_blank')}
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {slot.telegram_link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(slot.telegram_link, '_blank')}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleSlotClick(slot)}
                    >
                      <LineChart className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{slot.contributors?.length || 0}</span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSlotClick(slot)}
                    >
                      Contribute
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={() => handleOpenBoostDialog(index + 1)}
                className="flex items-center justify-center h-12 rounded-lg border border-dashed border-border/50 bg-background/30 hover:bg-background/50 transition-colors"
              >
                <Plus className="w-4 h-4 text-muted-foreground/50" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Boost Submission Dialog */}
      <Dialog open={isBoostDialogOpen} onOpenChange={setIsBoostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSlot ? 'Add More Boost Time' : 'Boost Your Project'}
            </DialogTitle>
          </DialogHeader>
          <BoostSubmissionForm 
            onSuccess={() => {
              setIsBoostDialogOpen(false);
              setSelectedSlot(null);
            }}
            existingSlot={selectedSlot}
          />
        </DialogContent>
      </Dialog>

      {/* Slot Details Dialog */}
      {selectedSlot && (
        <BoostSlotDetails
          slot={selectedSlot}
          isOpen={isSlotDetailsOpen}
          onClose={() => {
            setIsSlotDetailsOpen(false);
            setSelectedSlot(null);
          }}
          onContribute={handleContributeFromDetails}
        />
      )}
    </div>
  );
};
