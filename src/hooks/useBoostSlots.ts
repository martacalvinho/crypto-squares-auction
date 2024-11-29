import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'] & {
  total_contributions?: number;
  contributor_count?: number;
  total_hours?: number;
  active?: boolean;
  project?: {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    chart?: string;
  };
};

type WaitlistProject = {
  id: string;
  project_name: string;
  project_logo: string;
  contribution_amount: number;
  created_at: string;
};

function calculateBoostDuration(contributionAmount: number) {
  // Assuming 20 hours per 1 contribution amount
  const hours = Math.floor(contributionAmount * 20);
  const minutes = Math.floor((contributionAmount * 20 - hours) * 60);
  return { hours, minutes };
}

export const useBoostSlots = () => {
  return useQuery({
    queryKey: ['boost-slots'],
    queryFn: async () => {
      try {
        console.log('\n=== BOOST SLOT CHECK START ===');
        
        // 1. Get current slots and find empty ones
        const { data: currentSlots } = await supabase
          .from('boost_slots')
          .select('*')
          .order('slot_number', { ascending: true });

        // Track which slot numbers are taken
        const usedSlots = new Set((currentSlots || []).map(s => s.slot_number));
        const emptySlots = [];
        for (let i = 1; i <= 5; i++) {
          if (!usedSlots.has(i)) emptySlots.push(i);
        }

        console.log('Current slots:', currentSlots?.length || 0);
        console.log('Empty slots:', emptySlots);

        // 2. If we have empty slots, get waitlist projects
        if (emptySlots.length > 0) {
          console.log('Found empty slots, checking waitlist...');
          
          const { data: waitlistProjects } = await supabase
            .from('boost_waitlist')
            .select('*')
            .order('created_at', { ascending: true });

          console.log('Waitlist projects available:', waitlistProjects?.length || 0);

          // Try to promote waitlist projects to empty slots
          if (waitlistProjects?.length > 0) {
            console.log('Found empty slots, checking waitlist...');
            console.log('Waitlist projects available:', waitlistProjects.length);

            for (const waitlistProject of waitlistProjects) {
              const nextSlot = emptySlots[0];
              if (!nextSlot) break;

              console.log(`Promoting "${waitlistProject.project_name}" to slot ${nextSlot}`);

              // Calculate boost duration based on contribution amount
              const { hours, minutes } = calculateBoostDuration(waitlistProject.contribution_amount);
              const startTime = new Date();
              const endTime = new Date(startTime.getTime() + (hours * 60 + minutes) * 60 * 1000);

              // Ensure URLs are properly formatted and truncated
              const projectData = {
                project_name: String(waitlistProject.project_name).slice(0, 255),
                project_logo: waitlistProject.project_logo ? String(waitlistProject.project_logo).slice(0, 2048) : null,
                project_link: waitlistProject.project_link ? String(waitlistProject.project_link).slice(0, 2048) : '',
                telegram_link: waitlistProject.telegram_link ? String(waitlistProject.telegram_link).slice(0, 2048) : null,
                chart_link: waitlistProject.chart_link ? String(waitlistProject.chart_link).slice(0, 2048) : null,
                slot_number: nextSlot,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                initial_contribution: Number(waitlistProject.contribution_amount)
              };

              // Create the slot
              const { error: createSlotError } = await supabase
                .from('boost_slots')
                .insert(projectData);

              if (createSlotError) {
                console.error('Failed to create slot:', createSlotError);
                continue;
              }

              // Remove from waitlist
              const { error: deleteError } = await supabase
                .from('boost_waitlist')
                .delete()
                .eq('id', waitlistProject.id);

              if (deleteError) {
                console.error('Failed to remove from waitlist:', deleteError);
              }

              // Remove used slot
              emptySlots.shift();
            }
          }
        }

        // 3. Get final state and handle expired slots
        const { data: finalSlots } = await supabase
          .from('boost_slots')
          .select('*')
          .order('end_time', { ascending: false }); // Order by end_time descending (most time left first)

        const now = new Date();
        const activeSlots = [];
        const expiredSlots = [];

        (finalSlots || []).forEach(slot => {
          if (slot.end_time && new Date(slot.end_time) > now) {
            activeSlots.push(slot);
          } else {
            expiredSlots.push(slot);
            console.log(`Found expired slot ${slot.slot_number} (${slot.project_name})`);
          }
        });

        // Sort active slots by time remaining (most to least)
        activeSlots.sort((a, b) => {
          const aEndTime = new Date(a.end_time).getTime();
          const bEndTime = new Date(b.end_time).getTime();
          return bEndTime - aEndTime;
        });

        // Delete expired slots sequentially to avoid conflicts
        for (const slot of expiredSlots) {
          try {
            // First delete all contributions for this slot
            const { error: deleteContributionsError } = await supabase
              .from('boost_contributions')
              .delete()
              .eq('slot_id', slot.id);

            if (deleteContributionsError) {
              console.error(`Failed to delete contributions for slot ${slot.slot_number}:`, deleteContributionsError);
              continue; // Skip deleting the slot if we couldn't delete contributions
            }

            // Then delete the slot itself
            const { error: deleteSlotError } = await supabase
              .from('boost_slots')
              .delete()
              .eq('id', slot.id);
            
            if (deleteSlotError) {
              console.error(`Failed to delete expired slot ${slot.slot_number}:`, deleteSlotError);
            } else {
              console.log(`Deleted expired slot ${slot.slot_number}`);
            }
          } catch (err) {
            console.error(`Error deleting expired slot ${slot.slot_number}:`, err);
          }
        }

        // 4. Get final waitlist
        const { data: finalWaitlist } = await supabase
          .from('boost_waitlist')
          .select('*')
          .order('created_at', { ascending: true });

        console.log('=== FINAL STATE ===');
        console.log('Active slots:', activeSlots.length);
        console.log('Expired slots:', expiredSlots.length);
        console.log('Waitlist length:', finalWaitlist?.length || 0);
        console.log('=== BOOST SLOT CHECK END ===\n');

        return {
          slots: activeSlots,
          waitlist: finalWaitlist || []
        };
      } catch (error) {
        console.error('Error in useBoostSlots:', error);
        throw error;
      }
    },
    refetchInterval: 3000 // Check every 3 seconds
  });
};
