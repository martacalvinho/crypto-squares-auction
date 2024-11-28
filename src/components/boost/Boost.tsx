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
type WaitlistRow = Tables['boost_waitlist']['Row']

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
      <div className="grid grid-cols-5 gap-3">
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
                      <div className="w-14 h-14 relative">
                        <img
                          src={slot.project_logo}
                          alt={slot.project_name}
                          className="w-full h-full object-cover rounded-full border-2 border-crypto-dark group-hover:border-crypto-primary transition-colors"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-center text-gray-400 group-hover:text-crypto-primary transition-colors truncate max-w-[80px]">
                        {slot.project_name}
                      </p>
                    </button>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-crypto-primary transition-colors"
                   onClick={() => handleOpenDialog(index + 1)}>
                <Plus className="w-5 h-5 text-gray-700" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {waitlistProjects.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
          <span>{waitlistProjects.length} projects waiting</span>
          <img src="/images/rocket.gif" alt="Rocket" className="w-5 h-5" />
        </div>
      )}

      {selectedSlot && (
        <BoostSlotDetails
          slot={selectedSlot}
          isOpen={!!selectedSlot}
          onClose={handleCloseDetails}
          onContribute={handleContributeFromDetails}
          solPrice={0}
        />
      )}
    </div>
  );
};