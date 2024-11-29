import { cn } from "@/lib/utils";
import { Info, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { SpotHistory } from "./SpotHistory";
import { useState } from "react";

const formatSol = (value: number) => {
  return Number(value.toFixed(3)).toString();
};

interface SpotProps {
  spot: {
    id: number;
    currentPrice: number;
    project: {
      name: string;
      logo?: string;
      link?: string;
    } | null;
    walletAddress: string | null;
  };
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const GridSpot = ({ spot, onClick, className = '', style }: SpotProps) => {
  const [showHistory, setShowHistory] = useState(false);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the spot's onClick from firing
    setShowHistory(true);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          className,
          "relative aspect-square border cursor-pointer transition-all duration-300",
          spot.project ? "border-2 border-crypto-primary/60" : "border border-crypto-primary/20 hover:border-crypto-primary",
          "hover:shadow-lg hover:shadow-crypto-primary/20",
          "flex flex-col items-center justify-between p-3 text-center h-[180px]"
        )}
        style={style}
      >
        <div className="absolute top-2 left-2 text-xs opacity-70 z-10 bg-[#0D0F1A] px-1 rounded">
          #{spot.id + 1}
        </div>

        {/* Info Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 hover:bg-crypto-primary/20"
          onClick={handleInfoClick}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        {spot.project ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center">
              {spot.project.logo ? (
                <>
                  <img
                    src={spot.project.logo}
                    alt={spot.project.name}
                    className="w-16 h-16 object-contain rounded-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder.png';
                    }}
                  />
                  <div className="mt-2 text-sm font-medium truncate max-w-full">
                    {spot.project.name}
                  </div>
                </>
              ) : (
                <div className="text-sm font-medium">
                  {spot.project.name}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="text-xs text-crypto-primary">
                {formatSol(spot.currentPrice)}◎
              </div>
              <Button 
                variant="outline" 
                className="w-full text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                Steal
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center">
              <Plus className="w-8 h-8 text-crypto-primary/40" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="text-xs text-crypto-primary">
                {formatSol(spot.currentPrice)}◎
              </div>
              <Button 
                variant="outline" 
                className="w-full text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                Buy
              </Button>
            </div>
          </>
        )}
      </div>

      {/* History Modal */}
      <SpotHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        spotId={spot.id}
        projectName={spot.project?.name}
      />
    </>
  );
};