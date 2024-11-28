import * as React from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus, Rocket, ExternalLink, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BoostSubmissionForm } from '@/components/boost/BoostSubmissionForm';
import { BoostSlotDetails } from '@/components/boost/BoostSlotDetails';
import { formatTimeLeft } from './BoostUtils';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { useBoostSlots } from '@/hooks/useBoostSlots';
import cn from 'classnames';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { formatUrl } from "@/lib/url";

// Component types
type Tables = Database['public']['Tables'];
type BoostSlotRow = Tables['boost_slots']['Row'];
type WaitlistRow = Tables['boost_waitlist']['Row'];

interface BoostProps {
  onOpenBoostDialog: () => void;
}

export type BoostSlot = {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string | null;
  chart_link?: string | null;
  start_time: string;
  end_time: string;
  initial_contribution: number;
  contribution_amount: number;
  transaction_signature: string;
  wallet_address: string;
  created_at: string;
};

export type WaitlistProject = {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string | null;
  chart_link?: string | null;
  contribution_amount: number;
  transaction_signature: string;
  wallet_address: string;
  created_at: string;
};

export const Boost = ({ onOpenBoostDialog }: BoostProps) => {
  const { data: boostData } = useBoostSlots();
  const { connected } = useWallet();
  const { toast } = useToast();
  const [slots, setSlots] = useState<BoostSlot[]>([]);
  const [waitlistProjects, setWaitlistProjects] = useState<WaitlistProject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BoostSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle opening the dialog
  const handleOpenDialog = (slotNumber: number) => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to boost a project",
        variant: "destructive"
      });
      return;
    }

    onOpenBoostDialog();
  };

  // Function to handle closing the dialog
  const handleCloseDialog = () => {
    setIsOpen(false);
  };

  // Function to handle clicking on a filled slot
  const handleSlotClick = (slot: BoostSlot) => {
    setSelectedSlot(slot);
  };

  // Function to handle closing the slot details
  const handleCloseDetails = () => {
    setSelectedSlot(null);
  };

  // Function to handle contribution from details
  const handleContributeFromDetails = () => {
    setSelectedSlot(null);
    handleOpenDialog(selectedSlot?.id || 0);
  };

  // Update countdown timer every second
  useEffect(() => {
    if (!slots) return;

    const updateTimers = () => {
      const now = new Date();
      slots.forEach((slot) => {
        const endTime = new Date(slot.end_time);
        if (endTime > now) {
          const timeLeft = formatTimeLeft(slot.end_time);
          // Update UI with timeLeft if needed
        }
      });
    };

    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, [slots]);

  useEffect(() => {
    if (boostData) {
      setSlots(boostData.slots);
      setWaitlistProjects(boostData.waitlist);
    }
  }, [boostData]);

  // Calculate time progress for the circular indicator
  const calculateTimeProgress = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  // Create array of 5 slots, filling empty ones with null
  const slotsArray = [...(boostData?.slots || [])];
  while (slotsArray.length < 5) {
    slotsArray.push(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-crypto-primary" />
          <h2 className="text-lg font-semibold text-crypto-primary">Featured Projects</h2>
        </div>
        <button
          onClick={() => handleOpenDialog(0)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-crypto-primary/10 hover:bg-crypto-primary/20 text-crypto-primary rounded-full transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {slotsArray.map((slot, index) => (
          <div key={index} className="flex flex-col items-center">
            {slot ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSlotClick(slot)}
                      className="relative group"
                    >
                      <div className="w-16 h-16 relative">
                        <img
                          src={slot.project_logo}
                          alt={slot.project_name}
                          className="w-full h-full object-cover rounded-full border-2 border-crypto-dark group-hover:border-crypto-primary transition-colors"
                        />
                      </div>
                      {slot.project_link ? (
                        <a
                          href={slot.project_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 text-xs text-center text-gray-400 hover:text-crypto-primary transition-colors truncate block"
                        >
                          {slot.project_name}
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-center text-gray-400 group-hover:text-crypto-primary transition-colors truncate">
                          {slot.project_name}
                        </p>
                      )}
                      <div className="mt-1 w-full">
                        <Progress 
                          value={calculateTimeProgress(slot.start_time, slot.end_time)}
                          className="h-1 w-full bg-crypto-dark/30"
                        />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="p-2 space-y-2">
                      <p className="font-medium">{slot.project_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatTimeLeft(slot.end_time)}
                      </div>
                      <div className="flex gap-2">
                        {slot.project_link && (
                          <a
                            href={slot.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-crypto-primary/10 hover:bg-crypto-primary/20 text-crypto-primary transition-colors"
                          >
                            Website
                          </a>
                        )}
                        {slot.telegram_link && (
                          <a
                            href={slot.telegram_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-crypto-primary/10 hover:bg-crypto-primary/20 text-crypto-primary transition-colors"
                          >
                            Telegram
                          </a>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                onClick={() => handleOpenDialog(index + 1)}
                className="group w-16 h-16 rounded-full border-2 border-dashed border-gray-700 hover:border-crypto-primary/50 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-700 group-hover:text-crypto-primary/50" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSlot ? 'Add More Boost Time' : 'Boost Your Project'}
            </DialogTitle>
          </DialogHeader>
          <BoostSubmissionForm 
            onSuccess={handleCloseDialog}
            existingSlot={selectedSlot}
          />
        </DialogContent>
      </Dialog>

      {/* Slot Details Dialog */}
      {selectedSlot && (
        <BoostSlotDetails
          slot={selectedSlot}
          isOpen={!!selectedSlot}
          onClose={handleCloseDetails}
          onContribute={handleContributeFromDetails}
        />
      )}

      {waitlistProjects.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-400">{waitlistProjects.length} projects waiting</span>
          <div className="flex -space-x-2">
            {waitlistProjects.slice(0, 3).map((project, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full bg-white/5 shrink-0 overflow-hidden opacity-30 ring-1 ring-crypto-dark"
              >
                <img
                  src={project.project_logo}
                  alt={project.project_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};