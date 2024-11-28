import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Rocket, Plus } from 'lucide-react';
import { Boost } from '@/components/boost/Boost';

interface DesktopHeroProps {
  onStartBidding: () => void;
  onBoostProject: () => void;
  onOpenBoostDialog: () => void;
}

export const DesktopHero = ({ 
  onStartBidding, 
  onBoostProject, 
  onOpenBoostDialog 
}: DesktopHeroProps) => {
  return (
    <div className="hidden lg:block container mx-auto px-4 pt-24 pb-32">
      <div className="flex flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-crypto-primary to-purple-400 bg-clip-text text-transparent">
            Buy a spot in Solana History
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            Get 1 of 500 exclusive spots to showcase your crypto project
          </p>
          <div className="mt-8 flex flex-row gap-4">
            <Button onClick={onStartBidding} className="w-auto">
              Start Bidding
            </Button>
            <Button
              onClick={onBoostProject}
              variant="outline"
              className="w-auto bg-[#1a1d24] hover:bg-[#21242c]"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Boost Your Project
            </Button>
          </div>
        </div>

        <Card className="w-[400px] bg-[#1a1d24]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-crypto-primary" />
                <h2 className="text-lg font-semibold">Featured Projects</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-sm text-muted-foreground hover:text-primary"
                  onClick={onBoostProject}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Project
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Boost onOpenBoostDialog={onOpenBoostDialog} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
