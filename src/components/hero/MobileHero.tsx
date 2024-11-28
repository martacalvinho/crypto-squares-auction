import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface MobileHeroProps {
  onStartBidding: () => void;
  onBoostProject: () => void;
}

export const MobileHero = ({ onStartBidding, onBoostProject }: MobileHeroProps) => {
  return (
    <div className="lg:hidden container mx-auto px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold text-white">
          Buy a spot in Solana History
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Get 1 of 500 exclusive spots to showcase your crypto project
        </p>
        <div className="mt-4 flex flex-row gap-2 w-full max-w-[300px]">
          <Button 
            onClick={onBoostProject}
            variant="secondary"
            size="sm"
            className="flex-1 bg-[#1E2029] hover:bg-[#2A2C37] border-0 text-sm"
          >
            <Rocket className="w-3 h-3 mr-1" />
            Boost Project
          </Button>
          <Button 
            onClick={onStartBidding} 
            variant="default"
            size="sm" 
            className="flex-1 bg-white text-black hover:bg-white/90 text-sm"
          >
            Start Bidding
          </Button>
        </div>
      </div>
    </div>
  );
};
