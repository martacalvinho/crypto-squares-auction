import { ScrollArea } from "@/components/ui/scroll-area";
import { Bitcoin, TrendingUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { useAccount } from "@/integrations/wallet/use-account";
import { formatSol } from "@/lib/price";

export const ActivityFeed = () => {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    // Subscribe to both spots and spot_history changes
    const spotChangesSubscription = supabase
      .channel('activity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spots'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spot_history'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        }
      )
      .subscribe();

    return () => {
      spotChangesSubscription.unsubscribe();
    };
  }, [queryClient]);

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
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments'],
    queryFn: async () => {
      console.log('Fetching comments...');
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      
      console.log('Comments:', data);
      return data || [];
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity
  });

  const handleCommentSubmit = async () => {
    console.log('Current wallet state:', { address, isConnected });

    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet to comment",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure address is a string and not null/undefined
      const walletAddress = address.toString();
      console.log('Inserting comment with wallet address:', walletAddress);

      const commentData = {
        content: comment.trim(),
        user_id: walletAddress,
        created_at: new Date().toISOString(),
        is_general: true
      };

      console.log('Comment data:', commentData);

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Comment posted successfully",
      });

      setComment("");
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Comments Section */}
      <div className="flex items-center gap-2 mb-4 mt-8">
        <MessageSquare className="w-5 h-5 text-crypto-primary" />
        <h3 className="text-lg font-semibold text-crypto-primary">Comments</h3>
      </div>

      <ScrollArea className="h-[200px] pr-4 mb-4">
        <div className="space-y-4">
          {/* Comments */}
          {comments.map((comment) => (
            <div
              key={`comment-${comment.id}`}
              className={cn(
                "p-3 rounded-lg",
                "bg-gradient-to-r from-crypto-dark/60 to-crypto-dark/40",
                "border border-crypto-primary/5",
                "hover:border-crypto-primary/10 transition-all duration-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <MessageSquare className="w-4 h-4 text-crypto-primary/50" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-crypto-primary">
                      {comment.user_id ? 
                        `${comment.user_id.slice(0, 4)}...${comment.user_id.slice(-4)}` : 
                        'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-crypto-dark/50 border-crypto-primary/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCommentSubmit();
            }
          }}
        />
        <Button 
          onClick={handleCommentSubmit}
          className="w-full"
          variant="outline"
          disabled={isSubmitting}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </div>
  );
};