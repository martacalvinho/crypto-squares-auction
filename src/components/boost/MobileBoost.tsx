import { useState } from 'react';
import { Clock, Plus, Rocket } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BoostSubmissionForm } from './BoostSubmissionForm';
import { BoostSlotDetails } from './BoostSlotDetails';
import { formatTimeLeft, calculateTimeProgress } from '@/lib/utils';

interface MobileBoostProps {
  onOpenBoostDialog: () => void;
  solPrice?: number;
  slots?: any[];
  waitlistProjects?: any[];
}

export const MobileBoost = ({ onOpenBoostDialog, solPrice = 0, slots = [], waitlistProjects = [] }: MobileBoostProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const handleOpenDialog = (slotIndex: number) => {
    onOpenBoostDialog();
  };

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
  };

  const handleCloseDetails = () => {
    setSelectedSlot(null);
  };

  const handleContributeFromDetails = () => {
    setSelectedSlot(null);
    onOpenBoostDialog();
  };

  // Ensure we always have 5 slots
  const slotsArray = [...slots];
  while (slotsArray.length < 5) {
    slotsArray.push(null);
  }

  return (
    <div className="w-full">
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

      <div className="grid grid-cols-3 gap-4">
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
                      <div className="w-12 h-12 relative">
                        <img
                          src={slot.project_logo}
                          alt={slot.project_name}
                          className="w-full h-full object-cover rounded-full border-2 border-crypto-dark group-hover:border-crypto-primary transition-colors"
                          onError={(e) => {
                            console.error('Error loading boost image:', {
                              src: slot.project_logo,
                              projectName: slot.project_name,
                              error: e
                            });
                            // Replace with first letter on error
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                          }}
                        />
                        <div className="fallback hidden w-full h-full bg-crypto-primary/10 rounded-full flex items-center justify-center text-sm font-semibold border-2 border-crypto-dark group-hover:border-crypto-primary transition-colors">
                          {slot.project_name.charAt(0)}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-center text-gray-400 group-hover:text-crypto-primary transition-colors truncate max-w-[80px]">
                        {slot.project_name}
                      </p>
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
                className="group w-12 h-12 rounded-full border-2 border-dashed border-gray-700 hover:border-crypto-primary/50 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-700 group-hover:text-crypto-primary/50" />
              </button>
            )}
          </div>
        ))}
      </div>

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

      {/* Slot Details Dialog */}
      {selectedSlot && (
        <BoostSlotDetails
          slot={selectedSlot}
          isOpen={!!selectedSlot}
          onClose={handleCloseDetails}
          onContribute={handleContributeFromDetails}
          solPrice={solPrice}
        />
      )}
    </div>
  );
};
