import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";

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
  return (
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
                    console.error('Error loading image:', {
                      src: spot.project.logo,
                      projectName: spot.project.name,
                      error: e
                    });
                    // Replace with first letter on error
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                  }}
                />
                <div className="fallback hidden w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                  {spot.project.name.charAt(0)}
                </div>
              </>
            ) : (
              <div className="w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                {spot.project.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="w-full">
            {spot.project.link ? (
              <a
                href={spot.project.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(spot.project.link, '_blank', 'noopener,noreferrer');
                }}
                className="text-lg font-semibold truncate block text-crypto-primary hover:text-crypto-primary/80 transition-colors"
              >
                {spot.project.name}
              </a>
            ) : (
              <div className="text-lg font-semibold truncate text-crypto-primary">
                {spot.project.name}
              </div>
            )}
            <div className="text-sm font-bold mt-1">{formatSol(spot.currentPrice)} SOL</div>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full mt-2 bg-crypto-dark border-crypto-primary/20 hover:bg-crypto-primary/10 text-crypto-primary"
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
          <div className="flex-1 flex flex-col items-center justify-center">
            <Plus className="w-16 h-16 opacity-50" />
          </div>
          <div className="w-full">
            <div className="text-lg font-semibold text-crypto-primary opacity-70">Available</div>
            <div className="text-sm font-bold mt-1">{formatSol(spot.currentPrice)} SOL</div>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full mt-2 bg-crypto-dark border-crypto-primary/20 hover:bg-crypto-primary/10 text-crypto-primary"
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
  );
};