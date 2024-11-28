import { useEffect, useState } from 'react';
import { Search, Filter, Activity, MessageSquare, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatSol } from '@/lib/price';
import { Comments } from '@/components/Comments';
import { MobileActivityFeed } from './ActivityFeed';
import { MobileFeaturedProjects } from './FeaturedProjects';
import { BottomSheet } from './BottomSheet';
import { supabase } from '@/integrations/supabase/client';

interface BoostSpot {
  id: number;
  project_name: string;
  current_bid: number;
  project_logo: string | null;
}

interface MobileBoostProps {
  onOpenBoostDialog: () => void;
}

export const MobileBoost = ({ onOpenBoostDialog }: MobileBoostProps) => {
  const [spots, setSpots] = useState<BoostSpot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
    const subscription = supabase
      .channel('boost_spots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boost_slots' }, () => {
        fetchSpots();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSpots = async () => {
    try {
      const { data, error } = await supabase
        .from('boost_slots')
        .select('*')
        .order('current_bid', { ascending: false });

      if (error) throw error;
      setSpots(data || []);
    } catch (error) {
      console.error('Error fetching spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpots = spots.filter(spot =>
    spot.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bottomSheetTabs = [
    {
      id: 'search',
      label: 'Search & Filter',
      content: (
        <div className="p-4 space-y-4">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <div className="space-y-2">
            <h3 className="font-medium">Sort By</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">Highest Bid</Button>
              <Button variant="outline" size="sm">Latest</Button>
              <Button variant="outline" size="sm">Most Active</Button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'activity',
      label: 'Activity',
      content: <MobileActivityFeed />
    },
    {
      id: 'comments',
      label: 'Comments',
      content: <Comments />
    },
    {
      id: 'featured',
      label: 'Featured',
      content: <MobileFeaturedProjects />
    }
  ];

  return (
    <div className="block md:hidden relative min-h-screen">
      {/* Grid */}
      <div className="px-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))
          ) : (
            filteredSpots.map((spot) => (
              <Card key={spot.id} className="p-3">
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-2">
                  {spot.project_logo ? (
                    <img
                      src={spot.project_logo}
                      alt={spot.project_name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-muted-foreground">
                      {spot.project_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium truncate text-sm">{spot.project_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatSol(spot.current_bid)} SOL
                  </p>
                </div>
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={onOpenBoostDialog}
                >
                  Boost
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Bottom Sheet - Separate from main content */}
      <BottomSheet tabs={bottomSheetTabs} />
    </div>
  );
};
