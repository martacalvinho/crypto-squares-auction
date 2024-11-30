import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus, Clock, Users, Globe, LineChart, MessageCircle } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitAdditionalTime } from "@/components/boost/BoostUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatSol } from "@/lib/price";

interface FeaturedProject {
  id: number;
  project_name: string;
  project_link: string;
  project_logo: string | null;
  telegram_link: string | null;
  chart_link: string | null;
  end_time: string;
  description: string | null;
  contributor_count: number | null;
  start_time: string;
  initial_contribution: number;
}

export const MobileFeaturedProjects = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to featured spots changes
    const featuredSubscription = supabase
      .channel('mobile_featured_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spots',
          filter: 'is_featured=eq.true'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mobile-featured'] });
        }
      )
      .subscribe();

    return () => {
      featuredSubscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: featuredProjects = [], isLoading } = useQuery({
    queryKey: ['mobile-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .eq('is_featured', true)
        .order('updated_at', { ascending: false })
        .limit(5);  // Only get top 5 featured projects for mobile

      if (error) {
        console.error('Error fetching featured projects:', error);
        return [];
      }

      return data || [];
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity
  });

  const [selectedProject, setSelectedProject] = useState<FeaturedProject | null>(null);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [contribution, setContribution] = useState(1); // Start with minimum 1 SOL
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();

  const formatTimeLeft = (endTime: string) => {
    try {
      const end = new Date(endTime);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) return "Expired";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m left`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return "Invalid time";
    }
  };

  const handleContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : Number(value);
    
    if (numValue > 48) {
      toast({
        title: 'Maximum Time Exceeded',
        description: 'Maximum boost time is 48 hours (48 SOL)',
        variant: 'destructive',
      });
      setContribution(48);
    } else {
      setContribution(numValue);
    }
  };

  const handleContribute = async (slot: FeaturedProject) => {
    if (!wallet.connected) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (contribution < 1) {
      toast({
        title: 'Error',
        description: 'Minimum contribution is 1 SOL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await submitAdditionalTime(
        slot.id,
        contribution,
        wallet,
        connection,
        1 // TODO: Get actual SOL price
      );

      const additionalHours = Math.floor(contribution);
      const additionalMinutes = Math.round((contribution % 1) * 60);
      
      toast({
        title: 'Success!',
        description: `Added ${additionalHours}h ${additionalMinutes}m boost time!`,
      });

      setIsContributionDialogOpen(false);
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error submitting contribution',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeFromContribution = (amount: number) => {
    const hours = Math.floor(amount);
    const minutes = Math.round((amount % 1) * 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-4 -mx-4">
      {Array.from({ length: 5 }).map((_, index) => {
        const project = featuredProjects[index];
        
        if (!project) {
          return (
            <Card key={`empty-${index}`} className="overflow-hidden bg-black/20 border-crypto-primary/10">
              <CardHeader className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-[4.5rem] h-[4.5rem] rounded-xl bg-black/20 border border-crypto-primary/20 flex items-center justify-center">
                    <Plus className="w-7 h-7 text-crypto-primary/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-500">
                      Empty Slot
                    </CardTitle>
                    <div className="text-sm text-gray-500 mt-2">
                      Available for featuring
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        }

        return (
          <Card key={project.id} className="overflow-hidden bg-black/20 border-crypto-primary/10">
            <CardContent className="p-5 space-y-4">
              {/* Header with Logo and Title */}
              <div className="flex gap-4">
                {project.project_logo ? (
                  <img
                    src={project.project_logo}
                    alt={`${project.project_name} logo`}
                    className="w-[4.5rem] h-[4.5rem] rounded-xl object-cover bg-black/20 flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-[4.5rem] h-[4.5rem] rounded-xl bg-black/20 border border-crypto-primary/20 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-7 h-7 text-crypto-primary/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg truncate text-white">
                      {project.project_name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-crypto-primary/10 hover:bg-crypto-primary/20 text-crypto-primary flex-shrink-0"
                      onClick={(e) => {
                        if (!wallet.connected) {
                          toast({
                            title: 'Connect Wallet',
                            description: 'Please connect your wallet to contribute',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setSelectedProject(project);
                        setIsContributionDialogOpen(true);
                      }}
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats and Links */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="w-4 h-4 mr-1.5 text-crypto-primary" />
                    {formatTimeLeft(project.end_time)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatSol(project.initial_contribution)} SOL • {project.contributor_count} contributors
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-black/20 hover:bg-black/30 text-gray-400"
                    onClick={() => window.open(project.project_link, '_blank')}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  {project.telegram_link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-black/20 hover:bg-black/30 text-gray-400"
                      onClick={() => window.open(project.telegram_link, '_blank')}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {project.chart_link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-black/20 hover:bg-black/30 text-gray-400"
                      onClick={() => window.open(project.chart_link, '_blank')}
                    >
                      <LineChart className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Contribution Dialog */}
      <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
        <DialogContent className="bg-black/20 border-crypto-primary/10 p-5 mx-4 max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl pb-4">Contribute to {selectedProject?.project_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-crypto-primary">Current boost time</span>
                <span className="font-medium">
                  {selectedProject ? Math.ceil((new Date(selectedProject.end_time).getTime() - new Date(selectedProject.start_time).getTime()) / (1000 * 60 * 60)) : 0} hours
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="contribution" className="text-sm text-crypto-primary">
                Contribution Amount (SOL)
              </Label>
              <Input
                id="contribution"
                type="number"
                min={1}
                max={48}
                step={1}
                value={contribution || ''}
                onChange={handleContributionChange}
                required
                className="h-12 text-base bg-white/5 border-white/10 focus:border-crypto-primary"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>Time to add:</span>
                <span className="font-medium">{getTimeFromContribution(contribution)}</span>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-medium mt-2"
              onClick={() => selectedProject && handleContribute(selectedProject)}
              disabled={isSubmitting || contribution < 1}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Contributing...
                </div>
              ) : (
                `Contribute ${contribution} SOL`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileFeaturedProjects;
