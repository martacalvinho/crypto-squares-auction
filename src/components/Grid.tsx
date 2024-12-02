import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpotModal } from './SpotModal';
import { GridSpot } from './GridSpot';
import { SearchFilters } from './SearchFilters';
import { MobileSearchFilters } from './MobileSearchFilters';
import { ShareButtons } from './ShareButtons';
import { useAccount } from '@/integrations/wallet/use-account';
import { Button } from './ui/Button';
import { MobileBottomBar } from './MobileBottomBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Comments } from './Comments';
import { FeaturedBanner } from './FeaturedBanner';
import { ActivityFeed } from './ActivityFeed';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { RealtimeChannel } from '@supabase/supabase-js';

export const Grid = () => {
  const queryClient = useQueryClient();
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [displayedColumns, setDisplayedColumns] = useState(4);
  const maxColumns = 8;
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { isConnected } = useAccount();

  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);

    return () => {
      window.removeEventListener('resize', checkIfDesktop);
    };
  }, []);

  useEffect(() => {
    const container = document.querySelector('.overflow-x-auto');
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Subscribe to spots table changes
    const spotsSubscription: RealtimeChannel = supabase
      .channel('spots_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spots'
        },
        (payload) => {
          console.log('Spots change received:', payload);
          // Invalidate and refetch spots data
          queryClient.invalidateQueries({ queryKey: ['spots'] });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      spotsSubscription.unsubscribe();
    };
  }, [queryClient]);

  // Fetch spots from Supabase
  const { data: spots = [], isLoading } = useQuery({
    queryKey: ['spots'],
    queryFn: async () => {
      console.log('Fetching spots...');
      
      // First check if we have any spots
      const { count, error: countError } = await supabase
        .from('spots')
        .select('*', { count: 'exact', head: true });

      console.log('Spots count:', count);

      if (countError) {
        console.error('Error checking spots count:', countError);
        throw countError;
      }

      // Fetch all spots
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching spots:', error);
        throw error;
      }

      console.log('Fetched spots:', data);
      
      // Map spots to our format
      return data.map(spot => {
        const startingPrice = 0.005; // Starting price in SOL for empty spots
        return {
          id: spot.id,
          currentPrice: spot.project_name ? (spot.current_bid || startingPrice) : startingPrice,
          currentOwner: spot.current_bidder,
          project: spot.project_name ? {
            name: spot.project_name,
            link: spot.project_link,
            logo: spot.project_logo
          } : null,
          updatedAt: spot.updated_at
        };
      });
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity // Data won't become stale automatically
  });

  // Filter spots based on search term and filters
  const filteredSpots = spots.filter(spot => {
    // Search term filter
    let searchMatch = false;
    if (!searchTerm) {
      searchMatch = true;
    } else {
      // Check for project name match
      if (spot.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        searchMatch = true;
      }
      
      // Check for spot ID match
      const spotId = spot.id + 1;
      if (spotId.toString() === searchTerm) {
        searchMatch = true;
      }
      
      // Check for spot range match (e.g., "5-15" or "5 to 15")
      const rangeMatch = searchTerm.match(/^(\d+)(?:\s*[-to]\s*)(\d+)$/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        if (!isNaN(start) && !isNaN(end)) {
          searchMatch = spotId >= start && spotId <= end;
        }
      }
    }

    // Status filter
    const statusMatch = statusFilter === 'all' ||
      (statusFilter === 'occupied' && spot.project) ||
      (statusFilter === 'empty' && !spot.project);

    // Price range filter
    let priceMatch = true;
    if (priceRange !== 'all') {
      const [min, max] = priceRange === '50+' 
        ? [50, Infinity] 
        : priceRange.split('-').map(Number);
      priceMatch = spot.currentPrice >= min && spot.currentPrice <= max;
    }

    return searchMatch && statusMatch && priceMatch;
  });

  const handleShowMore = () => {
    setDisplayedColumns(prev => Math.min(prev + 4, maxColumns));
  };

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="text-crypto-primary">Loading spots...</div>
      </div>
    );
  }

  return (
    <div className="-mt-2">
      <div className="flex flex-col gap-1 mb-3">
        <h2 className="text-lg font-semibold text-primary">Available Spots</h2>
        <p className="text-sm text-muted-foreground">Claim one of the top 500 spots on Solana</p>
      </div>
      
      {/* Mobile Grid */}
      <div className="block md:hidden mb-20">
        <div className="relative">
          <div className="overflow-x-auto px-4 w-full">
            <div className="grid grid-rows-2 auto-cols-[120px] gap-2 pb-4" 
                 style={{ 
                   gridTemplateColumns: `repeat(${Math.ceil(filteredSpots.length / 2)}, 120px)`,
                   width: 'max-content'
                 }}>
              {filteredSpots.map((spot, index) => {
                // Calculate row and column position
                const row = index % 2;
                const col = Math.floor(index / 2);
                
                return (
                  <GridSpot 
                    key={spot.id} 
                    spot={spot} 
                    onClick={() => setSelectedSpot(spot.id)}
                    className="w-[120px]"
                    style={{
                      gridRow: row + 1,
                      gridColumn: col + 1
                    }}
                  />
                );
              })}
            </div>
          </div>
          {showLeftArrow && (
            <button 
              onClick={() => {
                const container = document.querySelector('.overflow-x-auto');
                if (container) {
                  container.scrollBy({ left: -360, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-border animate-pulse"
            >
              <ChevronLeft className="w-6 h-6 text-primary" />
            </button>
          )}
          {showRightArrow && (
            <button 
              onClick={() => {
                const container = document.querySelector('.overflow-x-auto');
                if (container) {
                  container.scrollBy({ left: 360, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-border animate-pulse"
            >
              <ChevronRight className="w-6 h-6 text-primary" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-12 gap-6">
        <div className="md:col-span-9">
          <div className="mb-4">
            <SearchFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
            />
          </div>
          <div className="grid grid-cols-5 gap-6">
            {filteredSpots.map((spot) => (
              <GridSpot
                key={spot.id}
                spot={spot}
                onClick={() => setSelectedSpot(spot.id)}
              />
            ))}
          </div>
        </div>
        {isDesktop && (
          <div className="md:col-span-3">
            <div className="glass-effect rounded-xl p-4 mb-6">
              <ActivityFeed />
            </div>
            {selectedSpot !== null && (
              <div className="glass-effect rounded-xl p-4">
                <h3 className="text-lg font-semibold text-crypto-primary mb-4">
                  Share Spot #{selectedSpot + 1}
                </h3>
                <ShareButtons spotId={selectedSpot} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Dialogs */}
      <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-4 border-b border-border/50">
            <DialogTitle>Search and Filter Spots</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <MobileSearchFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Bar */}
      {!isDesktop && (
        <MobileBottomBar 
          onSearchClick={() => setIsMobileSearchOpen(true)}
        />
      )}

      {selectedSpot !== null && (
        <SpotModal
          spotId={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          isConnected={isConnected}
          currentPrice={spots.find(s => s.id === selectedSpot)?.currentPrice || 0}
          isEmpty={spots.find(s => s.id === selectedSpot)?.project === null}
          currentOwner={spots.find(s => s.id === selectedSpot)?.currentOwner}
        />
      )}
    </div>
  );
};