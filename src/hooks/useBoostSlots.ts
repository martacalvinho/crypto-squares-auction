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
          
          const { data: waitlist } = await supabase
            .from('boost_waitlist')
            .select('*')
            .order('created_at', { ascending: true });

          console.log('Waitlist projects available:', waitlist?.length || 0);

          if (waitlist?.length) {
            for (let i = 0; i < Math.min(emptySlots.length, waitlist.length); i++) {
              const slot = emptySlots[i];
              const project = waitlist[i];

              console.log(`Promoting "${project.project_name}" to slot ${slot}`);

              const startTime = new Date();
              const endTime = new Date(startTime.getTime() + (project.contribution_amount * 20 * 60 * 60 * 1000));

              // Create slot
              const { error: insertError } = await supabase
                .from('boost_slots')
                .insert({
                  slot_number: slot,
                  project_name: project.project_name,
                  project_logo: project.project_logo,
                  project_link: project.project_link,
                  telegram_link: project.telegram_link,
                  chart_link: project.chart_link,
                  start_time: startTime.toISOString(),
                  end_time: endTime.toISOString(),
                  initial_contribution: project.contribution_amount
                });

              if (insertError) {
                console.error('Failed to create slot:', insertError);
                continue;
              }

              // Remove from waitlist
              const { error: deleteError } = await supabase
                .from('boost_waitlist')
                .delete()
                .eq('id', project.id);

              if (deleteError) {
                console.error('Failed to remove from waitlist:', deleteError);
              } else {
                console.log(`Successfully promoted ${project.project_name} to slot ${slot}`);
              }
            }
          }
        }

        // 3. Get final state and handle expired slots
        const { data: finalSlots } = await supabase
          .from('boost_slots')
          .select('*')
          .order('slot_number', { ascending: true });

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
