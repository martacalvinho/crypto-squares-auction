import { Clock, Users, Rocket, MessageCircle, LineChart } from "lucide-react";

interface BoostStatsProps {
  endTime: string;
  contributorCount: number;
  totalContributions: number;
  telegramLink?: string;
  chartLink?: string;
  formatTimeLeft: (time: string) => string;
}

export const BoostStats = ({
  endTime,
  contributorCount,
  totalContributions,
  telegramLink,
  chartLink,
  formatTimeLeft,
}: BoostStatsProps) => {
  return (
    <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 text-center">
      <div>
        <Clock className="w-3 h-3 mx-auto mb-1" />
        {formatTimeLeft(endTime) || "0h"}
      </div>
      <div>
        <Users className="w-3 h-3 mx-auto mb-1" />
        {contributorCount}
      </div>
      <div>
        <Rocket className="w-3 h-3 mx-auto mb-1" />
        {totalContributions.toFixed(2)} SOL
      </div>
      <div>
        {telegramLink ? (
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-crypto-primary/60 hover:text-crypto-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-3 h-3 mx-auto" />
          </a>
        ) : (
          <MessageCircle className="w-3 h-3 mx-auto text-gray-500/50" />
        )}
      </div>
      <div>
        {chartLink ? (
          <a
            href={chartLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-crypto-primary/60 hover:text-crypto-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <LineChart className="w-3 h-3 mx-auto" />
          </a>
        ) : (
          <LineChart className="w-3 h-3 mx-auto text-gray-500/50" />
        )}
      </div>
    </div>
  );
};