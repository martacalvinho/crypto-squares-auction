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
        "relative aspect-square border border-crypto-primary/20 cursor-pointer transition-all duration-300",
        "hover:border-crypto-primary hover:shadow-lg hover:shadow-crypto-primary/20",
        "flex flex-col items-center justify-center p-3 text-center"
      )}
      style={style}
    >
      <div className="absolute top-2 left-2 text-xs opacity-70 z-10 bg-[#0D0F1A] px-1 rounded">
        #{spot.id + 1}
      </div>
      
      {spot.project ? (
        <>
          <div className="mb-2">
            {spot.project.logo ? (
              <img
                src={spot.project.logo}
                alt={spot.project.name}
                className="w-16 h-16 object-contain rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                {spot.project.name.charAt(0)}
              </div>
            )}
          </div>
          {spot.project.link ? (
            <a
              href={spot.project.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                window.open(spot.project.link, '_blank', 'noopener,noreferrer');
              }}
              className="text-sm font-medium truncate w-full text-primary hover:text-primary/80 transition-colors mb-1"
            >
              {spot.project.name}
            </a>
          ) : (
            <div className="text-sm font-medium truncate w-full text-primary mb-1">
              {spot.project.name}
            </div>
          )}
          <div className="text-sm font-bold mb-2">{formatSol(spot.currentPrice)} SOL</div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full bg-crypto-dark border-crypto-primary/20 hover:bg-crypto-primary/10 text-crypto-primary"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Steal
          </Button>
        </>
      ) : (
        <>
          <Plus className="w-10 h-10 opacity-50 mb-2" />
          <div className="text-sm opacity-70 mb-1">Available</div>
          <div className="text-sm font-bold mb-2">{formatSol(spot.currentPrice)} SOL</div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full bg-crypto-dark border-crypto-primary/20 hover:bg-crypto-primary/10 text-crypto-primary"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Buy
          </Button>
        </>
      )}
    </div>
  );
};