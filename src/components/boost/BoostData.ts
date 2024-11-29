import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BoostSlot, WaitlistProject } from "./BoostTypes";
import { assignWaitlistToAvailableSlot } from "./BoostUtils";
import { useEffect } from "react";

export function useBoostData() {
  const queryClient = useQueryClient();

  const { data: boostSlots = [] } = useQuery({
    queryKey: ["boost-slots"],
    queryFn: async () => {
      // First get the slots
      const { data: slots, error: slotsError } = await supabase
        .from('boost_slots')
        .select('*')
        .order('slot_number', { ascending: true });

      if (slotsError) {
        console.error('Error fetching boost slots:', slotsError);
        throw slotsError;
      }

      // Then get contributions for each slot
      const slotsWithContributions = await Promise.all(
        slots.map(async (slot) => {
          const { data: contributions, error: contribError } = await supabase
            .from('boost_contributions')
            .select('amount')
            .eq('slot_id', slot.id);

          if (contribError) {
            console.error('Error fetching contributions:', contribError);
            return slot;
          }

          const totalContributions = (contributions || []).reduce(
            (sum, c) => sum + (Number(c.amount) || 0),
            Number(slot.initial_contribution) || 0
          );

          const contributorCount = (contributions || []).length + (slot.initial_contribution > 0 ? 1 : 0);

          return {
            ...slot,
            total_contributions: Number(totalContributions.toFixed(6)), // Fix precision issues
            contributor_count: contributorCount
          };
        })
      );

      return slotsWithContributions;
    },
    refetchInterval: 5000,
  });

  const { data: waitlistProjects = [] } = useQuery({
    queryKey: ["boost-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boost_waitlist')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching waitlist:', error);
        throw error;
      }
      return data as WaitlistProject[];
    },
    refetchInterval: 5000,
  });

  // Check for available slots and assign waitlist projects automatically
  useEffect(() => {
    const checkAndAssignWaitlist = async () => {
      console.log('Checking waitlist...', {
        waitlistLength: waitlistProjects.length,
        boostSlotsLength: boostSlots.length,
        waitlistProjects,
        boostSlots
      });

      if (waitlistProjects.length === 0) {
        console.log('No projects in waitlist to assign');
        return;
      }

      try {
        await assignWaitlistToAvailableSlot(waitlistProjects, boostSlots);
        // Invalidate queries to refresh data after assignment
        await invalidateQueries();
      } catch (error) {
        console.error('Error in automatic waitlist assignment:', error);
      }
    };

    // Only run if we have both waitlist and slots data
    if (waitlistProjects.length > 0 && boostSlots.length > 0) {
      checkAndAssignWaitlist();
    }
  }, [waitlistProjects, boostSlots]); // React to full array changes

  const invalidateQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["boost-slots"] });
    await queryClient.invalidateQueries({ queryKey: ["boost-waitlist"] });
  };

  return {
    boostSlots,
    waitlistProjects,
    invalidateQueries,
  };
}