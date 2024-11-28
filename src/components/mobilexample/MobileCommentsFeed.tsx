import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from '@/integrations/wallet/use-account';

interface Comment {
  id: number;
  created_at: string;
  content: string;
  user_address: string;
}

const MobileCommentsFeed = () => {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address, isConnected } = useAccount();

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
      return data || [];
    },
    refetchInterval: 5000
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
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            content: comment.trim(),
            user_address: address,
          }
        ]);

      if (error) throw error;

      setComment('');
      queryClient.invalidateQueries(['comments']);

      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
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

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (commentsLoading) {
    return <div className="text-gray-400">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comment Input Section */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-crypto-dark/80 to-crypto-dark/60 rounded-lg p-4 border border-crypto-primary/10">
          <Textarea
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px] bg-crypto-dark/30 border-crypto-primary/10 focus:border-crypto-primary/20 text-gray-200 placeholder:text-gray-500 resize-none"
          />
          <Button
            onClick={handleCommentSubmit}
            disabled={isSubmitting || !comment.trim()}
            className="w-full mt-3 bg-crypto-primary hover:bg-crypto-primary/90"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>

      {/* Comments Header */}
      <div className="flex items-center gap-2 pt-2">
        <MessageSquare className="w-5 h-5 text-crypto-primary" />
        <h3 className="text-lg font-semibold text-crypto-primary">Recent Comments</h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment: Comment) => (
          <div
            key={`comment-${comment.id}`}
            className={cn(
              "p-4 rounded-lg",
              "bg-gradient-to-r from-crypto-dark/60 to-crypto-dark/40",
              "border border-crypto-primary/5",
              "hover:border-crypto-primary/10 transition-all duration-300"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-crypto-dark flex items-center justify-center border border-crypto-primary/20 shrink-0">
                <MessageSquare className="w-4 h-4 text-crypto-primary/70" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-crypto-primary">
                    {shortenAddress(comment.user_address)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCommentsFeed;
