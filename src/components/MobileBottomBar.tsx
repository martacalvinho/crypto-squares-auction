import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle as MessageSquare, 
  Activity, 
  Rocket, 
  Star 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MobileActivityFeed } from './MobileActivityFeed';
import { Comments as MobileComments } from './Comments';
import { MobileFeatured } from './boost/MobileFeatured';

interface MobileBottomBarProps {
  onSearchClick: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onSearchClick
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-background/90 backdrop-blur-lg border-t border-border/50">
          <div className="flex items-center justify-around h-14">
            <button 
              onClick={onSearchClick} 
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px]">Search</span>
            </button>
            
            <button 
              onClick={() => setShowComments(true)} 
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">Comments</span>
            </button>
            
            <button 
              onClick={() => setShowActivity(true)} 
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Activity className="w-5 h-5" />
              <span className="text-[10px]">Activity</span>
            </button>
            
            <button 
              onClick={() => setShowFeatured(true)} 
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Rocket className="w-5 h-5" />
              <span className="text-[10px]">Featured</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/50">
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <MobileComments />
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={showActivity} onOpenChange={setShowActivity}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/50">
            <DialogTitle>Activity Feed</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <MobileActivityFeed />
          </div>
        </DialogContent>
      </Dialog>

      {/* Featured Dialog */}
      <Dialog open={showFeatured} onOpenChange={setShowFeatured}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/50">
            <DialogTitle>Featured Projects</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <MobileFeatured />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
