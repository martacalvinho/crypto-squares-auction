import { Dialog, DialogContent } from "./ui/dialog"
import { Info, Clock, Trophy, ArrowRight, Users, TrendingUp, Repeat, Star, Shield, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

interface SpotHistoryProps {
  isOpen: boolean
  onClose: () => void
  spotId: number
}

interface SpotHistoryData {
  spot_number: number
  current_price: number
  current_owner_name: string
  current_owner_logo: string
  current_owner_wallet: string
  total_owners: number
  total_steals: number
  first_owner_project: string
  first_owner_price: number
  first_owner_timestamp: string
  transaction_history: {
    from_project: string
    to_project: string
    price: number
    timestamp: string
    is_steal: boolean
    hold_duration: string
  }[]
}

export const SpotHistory = ({ isOpen, onClose, spotId }: SpotHistoryProps) => {
  const { data: spotHistory, isLoading, error } = useQuery<SpotHistoryData>({
    queryKey: ['spotHistory', spotId],
    queryFn: async () => {
      // Get current spot data
      const { data: spot, error: spotError } = await supabase
        .from('spots')
        .select('*')
        .eq('id', spotId)
        .single();

      if (spotError) throw spotError;

      // Get first owner data
      const { data: firstOwner, error: firstOwnerError } = await supabase
        .from('first_owners')
        .select('*')
        .eq('spot_id', spotId)
        .single();

      // Get transaction history ordered by timestamp
      const { data: history, error: historyError } = await supabase
        .from('spot_history')
        .select('*')
        .eq('spot_id', spotId)
        .order('timestamp', { ascending: true });

      if (historyError) throw historyError;

      // Find first owner from history if not in first_owners table
      const firstHistoryEntry = history?.[0];
      const firstOwnerFromHistory = firstHistoryEntry?.previous_project_name || firstHistoryEntry?.project_name;
      const firstOwnerPriceFromHistory = firstHistoryEntry?.price_paid || 0;
      const firstOwnerTimestampFromHistory = firstHistoryEntry?.timestamp;

      // Combine the data
      return {
        spot_number: spot.id + 1,
        current_price: spot.current_bid,
        current_owner_name: spot.project_name,
        current_owner_logo: spot.project_logo,
        current_owner_wallet: spot.wallet_address,
        total_owners: history?.length || 0,
        total_steals: history?.filter(h => h.is_steal)?.length || 0,
        first_owner_project: firstOwner?.project_name || firstOwnerFromHistory,
        first_owner_price: firstOwner?.price || firstOwnerPriceFromHistory,
        first_owner_timestamp: firstOwner?.timestamp || firstOwnerTimestampFromHistory,
        transaction_history: history?.map(h => ({
          from_project: h.previous_project_name,
          to_project: h.project_name,
          price: h.price_paid,
          timestamp: h.timestamp,
          is_steal: h.is_steal,
          hold_duration: h.hold_duration_hours ? `${h.hold_duration_hours}h` : ''
        })) || []
      };
    },
    enabled: isOpen // Only fetch when modal is open
  })

  if (!isOpen) return null

  if (isLoading) return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-primary"></div>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (error || !spotHistory) return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <div className="text-red-500 p-4">
          Error loading spot history
        </div>
      </DialogContent>
    </Dialog>
  )

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xl font-semibold">Spot #{spotHistory.spot_number}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold">{spotHistory.current_owner_name}</span>
              <span className="text-sm text-gray-400">Current Owner</span>
            </div>
          </div>

          {/* Spot Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Owner */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-500/20 p-2 rounded-md">
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium">First Owner</h4>
                  <div className="flex items-center gap-1 text-sm">
                    <span>{spotHistory.first_owner_project}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-crypto-primary">{spotHistory.first_owner_price}◎</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(spotHistory.first_owner_timestamp)}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Stats */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="bg-green-500/20 p-2 rounded-md">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">Current Stats</h4>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-crypto-primary">{spotHistory.current_price}◎</span>
                    <span className="text-gray-400">•</span>
                    <span>{spotHistory.total_owners} owners</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {spotHistory.total_steals} steals
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Ownership Timeline</h3>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />
              <div className="space-y-8">
                {spotHistory?.transaction_history?.map((transaction, index) => (
                  <div key={index} className="relative flex items-center gap-4">
                    <div className="relative">
                      <div className={cn(
                        "w-12 h-12 rounded-full border-2 bg-gray-900 z-10 flex items-center justify-center",
                        index === 0 ? 'border-yellow-500' : 
                        transaction.is_steal ? 'border-red-500/50' : 
                        'border-crypto-primary/50'
                      )}>
                        {transaction.to_project.substring(0, 2).toUpperCase()}
                      </div>
                      {index === 0 ? (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      ) : transaction.is_steal ? (
                        <div className="absolute -top-1 -right-1 bg-red-500/50 rounded-full p-1">
                          <Flame className="w-3 h-3 text-white" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "bg-gray-900/50 rounded-lg p-4",
                        index === 0 ? 'border border-yellow-500/30' : 
                        transaction.is_steal ? 'border border-red-500/20' : 
                        'border border-crypto-primary/30'
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{transaction.from_project}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span className="font-medium">{transaction.to_project}</span>
                          </div>
                          <span className="text-sm font-medium text-crypto-primary">{transaction.price}◎</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-sm text-gray-400">
                          <span>{formatDate(transaction.timestamp)}</span>
                          <span>{transaction.hold_duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
