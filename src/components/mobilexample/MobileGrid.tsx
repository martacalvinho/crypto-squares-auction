import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SpotModal } from '../SpotModal';
import { GridSpot } from '../GridSpot';
import { useAccount } from '@/integrations/wallet/use-account';
import { MobileFeatures } from './MobileFeatures';

export const MobileGrid = () => {
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'empty' | 'not.null'>('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortByPrice, setSortByPrice] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  // Parse price range
  const priceRangeValues = (() => {
    if (priceRange === 'all') return null;
    if (priceRange === '50+') return { min: 50, max: null };
    const [min, max] = priceRange.split('-').map(Number);
    return { min, max };
  })();

  const { data: spots = [], isLoading } = useQuery({
    queryKey: ['spots', searchTerm, statusFilter, priceRangeValues, sortByPrice],
    queryFn: async () => {
      let query = supabase
        .from('spots')
        .select('*');

      // Apply search filter
      if (searchTerm) {
        const spotNumber = parseInt(searchTerm);
        if (!isNaN(spotNumber)) {
          query = query.eq('id', spotNumber - 1);
        } else {
          query = query.ilike('project_name', `%${searchTerm}%`);
        }
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.is('project_name', statusFilter === 'empty' ? null : 'not.null');
      }

      // Apply price filter
      if (priceRangeValues) {
        if (priceRangeValues.min !== null) {
          query = query.gte('current_bid', priceRangeValues.min);
        }
        if (priceRangeValues.max !== null) {
          query = query.lte('current_bid', priceRangeValues.max);
        }
      }

      // Apply sorting
      if (sortByPrice) {
        query = query.order('current_bid', { ascending: true });
      } else {
        query = query.order('id', { ascending: true });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(spot => ({
        id: spot.id,
        currentPrice: spot.project_name ? (spot.current_bid || 0.005) : 0.005,
        currentOwner: spot.current_bidder,
        project: spot.project_name ? {
          name: spot.project_name,
          link: spot.project_link,
          logo: spot.project_logo
        } : null,
        updatedAt: spot.updated_at
      }));
    },
    refetchInterval: (!searchTerm && statusFilter === 'all' && priceRange === 'all') ? 5000 : false,
    keepPreviousData: true,
    refetchOnWindowFocus: !searchTerm,
    staleTime: searchTerm ? 10000 : 0
  });

  // Reset to first page when spots data changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      setCurrentPage(0);
    }
  }, [spots]);

  // Split spots into groups of 9 for pagination
  const spotGroups = spots.reduce((acc: any[][], spot, i) => {
    const groupIndex = Math.floor(i / 9);
    if (!acc[groupIndex]) acc[groupIndex] = [];
    acc[groupIndex].push(spot);
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-crypto-primary">Loading spots...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <MobileFeatures 
        onSearch={setSearchTerm}
        onStatusFilter={setStatusFilter}
        searchResults={spots.length}
        spotCount={spots.length}
      />
      <div className="absolute inset-0">
        <div 
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          <div className="flex h-full py-2">
            {spotGroups.map((group, groupIndex) => (
              <div 
                key={groupIndex} 
                className="min-w-full flex-shrink-0 snap-start flex items-center justify-center px-4"
              >
                <div className="grid grid-cols-3 gap-2 w-full" style={{ 
                  gridTemplateRows: 'repeat(3, 1fr)',
                  aspectRatio: '1'
                }}>
                  {group.map((spot) => (
                    <div 
                      key={spot.id} 
                      className="w-full h-full"
                    >
                      <GridSpot
                        spot={spot}
                        onClick={() => setSelectedSpot(spot.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
          {currentPage > 0 && (
            <button 
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pointer-events-auto mr-2 bg-crypto-primary/20 hover:bg-crypto-primary/30 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {currentPage < spotGroups.length - 1 && (
            <button 
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pointer-events-auto mr-3 bg-crypto-primary/20 hover:bg-crypto-primary/30 rounded-full p-2 transition-colors animate-pulse"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 19l7-7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {selectedSpot !== null && (
          <SpotModal
            spotId={selectedSpot}
            onClose={() => setSelectedSpot(null)}
            isConnected={isConnected}
            currentPrice={spots.find(s => s.id === selectedSpot)?.currentPrice || 0.005}
          />
        )}
      </div>
    </div>
  );
};
