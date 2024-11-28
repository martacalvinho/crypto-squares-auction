import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { formatSol } from "@/lib/price";

interface SpotProps {
  spot: {
    id: number;
    currentPrice: number;
    currentOwner: string | null;
    project: {
      name: string;
      link: string;
      logo: string;
    } | null;
    walletAddress: string | null;
  };
  onClick: () => void;
}

export const GridSpot = ({ spot, onClick }: SpotProps) => {
  const nextMinimumBid = spot.currentPrice >= 1 
    ? spot.currentPrice * 1.1  // 10% increase for spots ≥1 SOL
    : spot.currentPrice + 0.05; // 0.05 SOL increase for spots <1 SOL

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative aspect-square border border-crypto-primary/20 cursor-pointer transition-all duration-300",
        "hover:border-crypto-primary hover:shadow-lg hover:shadow-crypto-primary/20",
        "flex flex-col items-center justify-center p-2 text-center gap-1"
      )}
    >
      <div className="absolute top-2 left-2 text-xs opacity-70 z-10 bg-[#0D0F1A] px-1 rounded"># {spot.id + 1}</div>
      
      {spot.project ? (
        <>
          {spot.project.logo ? (
            <img
              src={spot.project.logo}
              alt={spot.project.name}
              className="w-24 h-24 object-contain rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
              {spot.project.name.charAt(0)}
            </div>
          )}
          {spot.project.link ? (
            <a
              href={spot.project.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                window.open(spot.project.link, '_blank', 'noopener,noreferrer');
              }}
              className="font-medium truncate w-full hover:text-crypto-primary transition-colors"
            >
              {spot.project.name}
            </a>
          ) : (
            <div className="font-medium truncate w-full">{spot.project.name}</div>
          )}
          <div className="text-xs opacity-70">Current: {formatSol(spot.currentPrice)} SOL</div>
          <div className="text-xs opacity-70">Next min: {formatSol(nextMinimumBid)} SOL</div>
        </>
      ) : (
        <>
          <Plus className="w-12 h-12 opacity-50" />
          <div className="text-sm opacity-70">Available</div>
          <div className="text-xs opacity-70">Start: {formatSol(spot.currentPrice)} SOL</div>
        </>
      )}
    </div>
  );
};