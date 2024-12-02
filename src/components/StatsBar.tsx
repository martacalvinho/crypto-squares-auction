import { Users, TrendingUp, Award, MessageCircle, Rocket, Zap, Sword } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect } from "react";

interface StatsBarProps {
  stats?: {
    occupiedSpots: number;
    totalBids: number;
    highestBid: number;
    totalUsers: number;
    totalComments: number;
    boostedProjects: number;
  };
  variant?: 'default' | 'mobile';
}

export const StatsBar = ({ stats, variant = 'default' }: StatsBarProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to relevant tables for stats updates
    const statsSubscription = supabase
      .channel('stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spots'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boost_stats'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
      )
      .subscribe();

    return () => {
      statsSubscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: dbStats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Get unique wallets from both wallet_stats and boost_contributions
      const { data: uniqueWallets } = await supabase
        .rpc('get_unique_wallets_count');

      const [
        occupiedCount,
        { data: spots },
        { count: totalComments },
        { data: boostStats }
      ] = await Promise.all([
        supabase.from('spots').select('*', { count: 'exact', head: true })
          .not('project_name', 'is', null),
        supabase.from('spots').select('current_bid').order('current_bid', { ascending: false }).limit(1),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('boost_stats').select('total_projects_boosted').single()
      ]);

      return {
        occupiedSpots: occupiedCount.count || 0,
        totalBids: occupiedCount.count || 0,
        highestBid: spots?.[0]?.current_bid || 0,
        totalUsers: uniqueWallets || 0,
        totalComments: totalComments || 0,
        boostedProjects: boostStats?.total_projects_boosted || 0
      };
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity
  });

  if (isLoading) {
    return <div>Loading stats...</div>;
  }

  const finalStats = stats || dbStats;

  const statItems = [
    {
      label: "Occupied",
      value: finalStats?.occupiedSpots || 0,
      icon: Users,
      color: "from-pink-500 to-rose-500",
      mobileHide: false
    },
    {
      label: "Highest Bid",
      value: `${finalStats?.highestBid || 0} SOL`,
      icon: Award,
      color: "from-amber-500 to-orange-500",
      mobileHide: false
    },
    {
      label: "Boosted",
      value: finalStats?.boostedProjects || 0,
      icon: Rocket,
      color: "from-purple-500 to-indigo-500",
      tooltip: "Total number of projects that have been boosted",
      mobileHide: false
    },
    {
      label: "Users",
      value: finalStats?.totalUsers || 0,
      icon: Users,
      color: "from-green-500 to-emerald-500",
      tooltip: "Unique wallets that have interacted with the platform",
      mobileHide: false
    },
    {
      label: "Comments",
      value: finalStats?.totalComments || 0,
      icon: MessageCircle,
      color: "from-blue-500 to-cyan-500",
      mobileHide: false
    }
  ];

  return (
    <div className={cn(
      "flex gap-3",
      variant === 'mobile' && "flex-col"
    )}>
      {statItems
        .filter(item => variant === 'mobile' || !item.mobileHide)
        .map((stat, index) => (
          <TooltipProvider key={stat.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    "bg-gradient-to-r from-crypto-dark/60 to-crypto-dark/40",
                    "border border-crypto-primary/5",
                    "hover:border-crypto-primary/10 transition-all duration-300",
                    variant === 'mobile' && "justify-between w-full"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <stat.icon className="w-4 h-4 text-crypto-primary/50" />
                    <span className="text-xs text-gray-400">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-crypto-primary">
                    {stat.value}
                  </span>
                </div>
              </TooltipTrigger>
              {stat.tooltip && (
                <TooltipContent>
                  <p>{stat.tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
    </div>
  );
};