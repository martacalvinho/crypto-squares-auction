import { Plus } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import { BoostStats } from "./BoostStats";

interface BoostSlot {
  id: number;
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string;
  chart_link?: string;
  start_time: string;
  end_time: string;
  total_contributions: number;
  contributor_count: number;
}

interface BoostSlotCardProps {
  slot: BoostSlot | null;
  index: number;
  formatTimeLeft: (time: string) => string;
  onClick: () => void;
}

export const BoostSlotCard = ({ slot, index, formatTimeLeft, onClick }: BoostSlotCardProps) => {
  const isPlaceholder = !slot;

  return (
    <Card 
      className={cn(
        "bg-crypto-dark/20 border-crypto-primary/10 transition-all duration-200",
        isPlaceholder && "cursor-pointer hover:bg-crypto-dark/30 hover:border-crypto-primary/20 hover:scale-102"
      )}
      onClick={() => isPlaceholder && onClick()}
    >
      <CardContent className="p-3">
        <div className="flex flex-col space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-crypto-primary/10 to-crypto-dark flex items-center justify-center">
            {isPlaceholder ? (
              <Plus className="w-6 h-6 text-crypto-primary/60" />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={slot.project_logo}
                  alt={slot.project_name}
                  className="w-full h-full object-cover"
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
                <div className="fallback hidden w-full h-full bg-crypto-primary/10 flex items-center justify-center text-lg font-semibold">
                  {slot.project_name.charAt(0)}
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <h4 className="font-medium truncate mb-1 text-crypto-primary/80">
              {isPlaceholder ? "Available Slot" : slot.project_name}
            </h4>
          </div>
          <BoostStats
            endTime={isPlaceholder ? "" : slot.end_time}
            contributorCount={isPlaceholder ? 0 : slot.contributor_count}
            totalContributions={isPlaceholder ? 0 : slot.total_contributions}
            telegramLink={isPlaceholder ? undefined : slot.telegram_link}
            chartLink={isPlaceholder ? undefined : slot.chart_link}
            formatTimeLeft={formatTimeLeft}
          />
        </div>
      </CardContent>
    </Card>
  );
};