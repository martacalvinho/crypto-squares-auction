import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpotModal } from './SpotModal';
import { GridSpot } from './GridSpot';
import { SearchFilters } from './SearchFilters';
import { ShareButtons } from './ShareButtons';
import { useAccount } from '@/integrations/wallet/use-account';
import { ActivityFeed } from './ActivityFeed';

export const Grid = () => {
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [isDesktop, setIsDesktop] = useState(false);
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
        .order('id');

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
    refetchInterval: 5000
  });

  // Filter spots based on search term and filters
  const filteredSpots = spots.filter(spot => {
    // Search term filter
    const searchMatch = !searchTerm || 
      (spot.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (spot.id + 1).toString() === searchTerm);

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

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="text-crypto-primary">Loading spots...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto p-4">      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-crypto-primary mb-2">Available Spots</h2>
          <p className="text-sm text-gray-400 mb-4">Claim one of the top 500 spots on Solana</p>
          <SearchFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-9">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 md:gap-8 animate-fade-in">
              {filteredSpots.map((spot) => (
                <GridSpot
                  key={spot.id}
                  spot={spot}
                  onClick={() => setSelectedSpot(spot.id)}
                />
              ))}
            </div>
          </div>
          <div className="md:col-span-3 space-y-8">
            <div className="glass-effect rounded-xl p-4">
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
        </div>
      </div>
      {selectedSpot !== null && (
        <SpotModal
          spotId={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          isConnected={isConnected}
          currentPrice={spots[selectedSpot]?.currentPrice || 0.005}
        />
      )}
    </div>
  );
};