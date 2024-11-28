import { ScrollArea } from "@/components/ui/scroll-area";
import { Bitcoin, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatSol } from "@/lib/price";

export const MobileActivityFeed = () => {
  // Fetch activities (spots with recent changes)
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      console.log('Fetching activities...');
      
      // Get recently updated spots
      const { data: recentSpots, error: spotsError } = await supabase
        .from('spots')
        .select('*')
        .not('project_name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (spotsError) {
        console.error('Error fetching spots:', spotsError);
        throw spotsError;
      }

      // Get history for these spots
      const spotIds = recentSpots?.map(s => s.id) || [];
      const { data: history, error: historyError } = await supabase
        .from('spot_history')
        .select('*')
        .in('spot_id', spotIds)
        .order('timestamp', { ascending: false });

      if (historyError) {
        console.error('Error fetching history:', historyError);
        throw historyError;
      }

      // Map spots to activities, checking history to determine if it was a steal
      return (recentSpots || []).map(spot => {
        // Find the most recent history entry for this spot
        const spotHistory = history?.filter(h => h.spot_id === spot.id) || [];
        const latestHistory = spotHistory.length > 0 ? 
          spotHistory.reduce((latest, current) => 
            new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
          ) : null;

        // If there's history and it matches the current update, it's a steal
        const isSteal = latestHistory && 
                       latestHistory.project_name === spot.project_name &&
                       latestHistory.previous_project_name !== null;

        return {
          id: spot.id,
          project_name: spot.project_name,
          current_bid: spot.current_bid,
          updated_at: spot.updated_at,
          isSteal,
          previousProject: isSteal ? latestHistory.previous_project_name : null
        };
      });
    },
    refetchInterval: 5000
  });

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
    <div className="w-full h-full bg-crypto-dark/50 rounded-xl p-4 backdrop-blur-sm">
      {/* Activities Section */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-crypto-primary" />
        <h3 className="text-lg font-semibold text-crypto-primary">Activity Feed</h3>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {/* Activity Items */}
          {activities.map((activity) => (
            <div
              key={`activity-${activity.id}`}
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
                    activity.isSteal ? "text-red-500" : "text-crypto-primary/70"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-crypto-primary">
                      {activity.project_name}
                    </span>{' '}
                    {activity.isSteal ? (
                      <>
                        <span className="text-red-500 font-bold">🔥 stole</span> spot #{activity.id + 1} from{' '}
                        <span className="text-gray-400">{activity.previousProject}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-crypto-primary">🎉 claimed</span> spot #{activity.id + 1}
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-xs font-semibold",
                      activity.isSteal ? "text-red-500" : "text-crypto-primary"
                    )}>
                      {formatSol(activity.current_bid)} SOL
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
