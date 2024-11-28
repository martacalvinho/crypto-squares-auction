import { useQuery } from '@tanstack/react-query';
import { Activity, Bitcoin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: number;
  project_name: string;
  current_bid: number;
  updated_at: string;
  isFirstBuy: boolean;
  previousProject?: string;
}

const MobileActivityFeed = () => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      console.log('Fetching activities...');
      
      // Get recently changed spots
      const { data: recentSpots, error: spotsError } = await supabase
        .from('spots')
        .select('*')
        .not('project_name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (spotsError) {
        console.error('Error fetching recent spots:', spotsError);
        throw spotsError;
      }

      // Get spot history for these spots
      const spotIds = recentSpots?.map(s => s.id) || [];
      const { data: history, error: historyError } = await supabase
        .from('spot_history')
        .select('*')
        .in('spot_id', spotIds)
        .order('timestamp', { ascending: false });

      if (historyError) {
        console.error('Error fetching history:', historyError);
      }

      // Map spots to determine if they're new or stolen
      return (recentSpots || []).map(spot => {
        const spotHistory = history?.filter(h => h.spot_id === spot.id) || [];
        const previousEntry = spotHistory[0];
        
        return {
          id: spot.id,
          project_name: spot.project_name,
          current_bid: spot.current_bid,
          updated_at: spot.updated_at,
          isFirstBuy: spotHistory.length === 0,
          previousProject: previousEntry?.previous_project_name
        };
      });
    },
    refetchInterval: 5000
  });

  if (isLoading) {
    return <div className="text-gray-400">Loading activities...</div>;
  }

  if (!activities?.length) {
    return <div className="text-gray-400">No recent activity</div>;
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {activities?.map((activity: ActivityItem) => {
        if (!activity) return null;
        
        return (
          <div
            key={activity.id}
            className={cn(
              "p-3 rounded-lg",
              "bg-gradient-to-r from-crypto-dark/80 to-crypto-dark/60",
              "border border-crypto-primary/10",
              "hover:border-crypto-primary/20 transition-all duration-300"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Bitcoin className={cn(
                  "w-4 h-4",
                  activity.previousProject ? "text-red-500" : "text-crypto-primary/70"
                )} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-crypto-primary">
                    {activity.project_name}
                  </span>{' '}
                  {activity.previousProject ? (
                    <>
                      <span className="text-red-500">🔥 stole</span> spot #{activity.id} from{' '}
                      <span className="text-gray-400">{activity.previousProject}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-crypto-primary">🎉 claimed</span> spot #{activity.id}
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    activity.previousProject ? "text-red-500" : "text-crypto-primary"
                  )}>
                    {activity.current_bid} ETH
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(activity.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileActivityFeed;
