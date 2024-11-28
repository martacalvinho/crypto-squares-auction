import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { formatUrl } from "@/lib/url";

type BoostSlot = Database['public']['Tables']['boost_slots']['Row'];
type WaitlistProject = Database['public']['Tables']['boost_waitlist']['Row'];

// Constants
const HOURS_PER_SOL = 50; // 0.02 SOL per hour
const MAX_BOOST_HOURS = 48;
const MIN_CONTRIBUTION_SOL = 0.02; // Minimum buy-in is 0.02 SOL
const MAX_CONTRIBUTION_SOL = 0.96; // 48 hours * 0.02 SOL
const RECIPIENT_WALLET = new PublicKey('5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz4FPeDR1dWySB');

export interface ProjectSubmission {
  project_name: string;
  project_logo: string;
  project_link: string;
  telegram_link?: string;
  chart_link?: string;
  initial_contribution: number;
}

export function calculateBoostDuration(solAmount: number) {
  const hours = solAmount * HOURS_PER_SOL;
  const cappedHours = Math.min(hours, MAX_BOOST_HOURS);
  const minutes = (hours - Math.floor(hours)) * 60;

  return {
    hours: Math.floor(cappedHours),
    minutes: Math.round(minutes),
  };
}

export async function processBoostPayment(
  wallet: WalletContextState,
  connection: Connection,
  solAmount: number
) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  if (!solAmount || solAmount < MIN_CONTRIBUTION_SOL || isNaN(solAmount)) {
    console.error('Invalid SOL amount:', { solAmount });
    throw new Error(`Minimum contribution is ${MIN_CONTRIBUTION_SOL} SOL`);
  }

  if (solAmount > MAX_CONTRIBUTION_SOL) {
    console.error('Exceeds maximum SOL amount:', { solAmount });
    throw new Error(`Maximum contribution is ${MAX_CONTRIBUTION_SOL} SOL (48 hours)`);
  }

  console.log('Processing payment:', {
    solAmount,
  });

  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  console.log('Calculated amounts:', {
    solAmount,
    lamports,
    LAMPORTS_PER_SOL,
  });

  if (isNaN(lamports) || lamports <= 0) {
    console.error('Invalid lamports amount:', {
      solAmount,
      lamports
    });
    throw new Error('Invalid payment amount. Please try again.');
  }

  try {
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: RECIPIENT_WALLET,
        lamports: BigInt(lamports),
      })
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send transaction
    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    return signature;
  } catch (error) {
    console.error('Transaction error:', error);
    throw new Error('Failed to process payment. Please try again.');
  }
}

export async function submitBoostProject(
  values: ProjectSubmission,
  wallet: WalletContextState,
  connection: Connection
) {
  try {
    // Validate minimum contribution
    if (values.initial_contribution < MIN_CONTRIBUTION_SOL) {
      throw new Error(`Minimum contribution is ${MIN_CONTRIBUTION_SOL} SOL`);
    }

    if (values.initial_contribution > MAX_CONTRIBUTION_SOL) {
      throw new Error(`Maximum contribution is ${MAX_CONTRIBUTION_SOL} SOL (48 hours)`);
    }

    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Format URLs
    const formattedValues = {
      ...values,
      project_link: formatUrl(values.project_link),
      project_logo: values.project_logo ? formatUrl(values.project_logo) : values.project_logo,
      telegram_link: values.telegram_link ? formatUrl(values.telegram_link) : values.telegram_link,
      chart_link: values.chart_link ? formatUrl(values.chart_link) : values.chart_link,
    };

    try {
      // Validate URLs
      new URL(formattedValues.project_link);
      if (formattedValues.project_logo) new URL(formattedValues.project_logo);
      if (formattedValues.telegram_link) new URL(formattedValues.telegram_link);
      if (formattedValues.chart_link) new URL(formattedValues.chart_link);
    } catch {
      throw new Error("Please enter valid URLs");
    }

    // Process payment first
    const signature = await processBoostPayment(
      wallet,
      connection,
      formattedValues.initial_contribution
    );

    // Calculate boost duration
    const { hours, minutes } = calculateBoostDuration(formattedValues.initial_contribution);
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (hours * 60 + minutes) * 60 * 1000);

    // Check for available slots
    const { data: slots, error: slotsError } = await supabase
      .from('boost_slots')
      .select('slot_number')
      .order('slot_number', { ascending: true });

    if (slotsError) {
      console.error('Error fetching slots:', slotsError);
      throw new Error('Failed to check available slots');
    }

    const usedSlots = new Set(slots?.map((s) => s.slot_number) || []);
    let availableSlot = null;

    // Find first available slot (1-5)
    for (let i = 1; i <= 5; i++) {
      if (!usedSlots.has(i)) {
        availableSlot = i;
        break;
      }
    }

    if (!availableSlot) {
      // Add to waitlist if no slots available
      const { error: waitlistError } = await supabase
        .from('boost_waitlist')
        .insert({
          project_name: formattedValues.project_name,
          project_logo: formattedValues.project_logo,
          project_link: formattedValues.project_link,
          telegram_link: formattedValues.telegram_link || null,
          chart_link: formattedValues.chart_link || null,
          contribution_amount: formattedValues.initial_contribution,
          transaction_signature: signature,
          wallet_address: wallet.publicKey.toString()
        });

      if (waitlistError) {
        console.error('Error adding to waitlist:', waitlistError);
        throw new Error('Failed to add to waitlist');
      }

      return { type: 'waitlist', signature };
    }

    // Add to boost slots
    console.log('Inserting boost slot with data:', {
      slot_number: availableSlot,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      project_name: formattedValues.project_name,
      project_logo: formattedValues.project_logo,
      project_link: formattedValues.project_link,
      initial_contribution: formattedValues.initial_contribution
    });

    // Ensure data types match schema
    const boostSlotData = {
      project_name: String(formattedValues.project_name).slice(0, 255), // varchar(255)
      project_logo: String(formattedValues.project_logo).slice(0, 2048), // varchar(2048)
      project_link: String(formattedValues.project_link).slice(0, 2048), // varchar(2048)
      telegram_link: formattedValues.telegram_link ? String(formattedValues.telegram_link).slice(0, 2048) : null,
      chart_link: formattedValues.chart_link ? String(formattedValues.chart_link).slice(0, 2048) : null,
      slot_number: Number(availableSlot), // integer
      start_time: startTime.toISOString(), // timestamp with time zone
      end_time: endTime.toISOString(), // timestamp with time zone
      initial_contribution: Number(formattedValues.initial_contribution) // numeric
    };

    console.log('Formatted boost slot data:', boostSlotData);

    const insertResult = await supabase
      .from('boost_slots')
      .insert(boostSlotData)
      .select('*');

    console.log('Full insert result:', JSON.stringify(insertResult, null, 2));

    if (insertResult.error) {
      console.error('Error inserting boost slot:', {
        error: insertResult.error,
        details: insertResult.error.details,
        message: insertResult.error.message,
        hint: insertResult.error.hint,
        code: insertResult.error.code
      });
      throw new Error(`Failed to create boost slot: ${insertResult.error.message}`);
    }

    // If status is 201 but no data, fetch the inserted record
    if ((!insertResult.data || insertResult.data.length === 0) && insertResult.status === 201) {
      console.log('Insert successful (201), fetching inserted record...');
      const { data: fetchedSlot, error: fetchError } = await supabase
        .from('boost_slots')
        .select('*')
        .eq('slot_number', boostSlotData.slot_number)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error fetching inserted slot:', fetchError);
        throw new Error(`Failed to fetch inserted slot: ${fetchError.message}`);
      }

      if (!fetchedSlot) {
        console.error('Could not find inserted slot');
        throw new Error('Failed to find inserted slot');
      }

      console.log('Successfully fetched inserted slot:', fetchedSlot);
      insertResult.data = [fetchedSlot];
    }

    const slotId = insertResult.data[0].id;
    console.log('Successfully created boost slot with ID:', slotId);

    // Increment the total_projects_boosted counter
    console.log('Attempting to increment boost stats...');
    const { data: statsData, error: statsError } = await supabase.rpc('increment_boosted_projects');
    if (statsError) {
      console.error('Error incrementing boost stats:', {
        error: statsError,
        details: statsError.details,
        message: statsError.message,
        hint: statsError.hint,
        code: statsError.code
      });
      // Don't throw here as the slot is already created
      console.warn('Failed to increment boost stats, but slot was created');
    } else {
      console.log('Successfully incremented boost stats:', statsData);
    }

    // Add contribution record
    const contributionData = {
      slot_id: slotId,
      wallet_address: wallet.publicKey.toString(),
      amount: Number(formattedValues.initial_contribution),
      transaction_signature: signature
    };

    console.log('Adding contribution record:', contributionData);

    const { error: contributionError } = await supabase
      .from('boost_contributions')
      .insert(contributionData);

    if (contributionError) {
      console.error('Error recording contribution:', contributionError);
      // Don't throw here as the slot is already created
      // Instead, we'll log it and let the user proceed
      console.warn('Failed to record contribution, but slot was created');
    }

    return { type: 'boosted', slot: availableSlot, signature };
  } catch (error) {
    console.error('Error in submitBoostProject:', error);
    throw error;
  }
}

export async function assignWaitlistToAvailableSlot(
  waitlistProjects: WaitlistProject[],
  boostSlots: BoostSlot[]
): Promise<boolean> {
  if (waitlistProjects.length === 0) return false;

  const now = new Date();
  
  // Find expired slots
  const expiredSlots = boostSlots.filter(slot => new Date(slot.end_time) <= now);
  
  if (expiredSlots.length === 0) return false;

  // Get the first project from waitlist
  const projectToAssign = waitlistProjects[0];
  
  // Calculate initial boost duration based on contribution
  const boostHours = calculateBoostDuration(projectToAssign.initial_contribution);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + boostHours * 60 * 60 * 1000);

  try {
    // Start a transaction
    const { error: insertError } = await supabase
      .from('boost_slots')
      .insert({
        project_name: projectToAssign.project_name,
        project_logo: projectToAssign.project_logo,
        project_link: projectToAssign.project_link,
        telegram_link: projectToAssign.telegram_link,
        chart_link: projectToAssign.chart_link,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        initial_contribution: projectToAssign.initial_contribution
      });

    if (insertError) {
      console.error('Error inserting new boost slot:', insertError);
      return false;
    }

    // Remove the project from waitlist
    const { error: deleteError } = await supabase
      .from('waitlist_projects')
      .delete()
      .eq('id', projectToAssign.id);

    if (deleteError) {
      console.error('Error removing project from waitlist:', deleteError);
      return false;
    }

    // Delete the expired slot with the lowest end_time
    const oldestExpiredSlot = expiredSlots.reduce((oldest, current) => 
      new Date(oldest.end_time) <= new Date(current.end_time) ? oldest : current
    );
    
    const { error: deleteSlotError } = await supabase
      .from('boost_slots')
      .delete()
      .eq('id', oldestExpiredSlot.id);

    if (deleteSlotError) {
      console.error('Error deleting expired slot:', deleteSlotError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in assignWaitlistToAvailableSlot:', error);
    return false;
  }
}

export async function deleteExpiredSlot(slotId: string) {
  // First delete all contributions for this slot
  const { error: contributionsError } = await supabase
    .from('boost_contributions')
    .delete()
    .eq('slot_id', slotId);

  if (contributionsError) {
    console.error('Error deleting contributions:', contributionsError);
    throw new Error('Failed to delete contributions');
  }

  // Then delete the slot itself
  const { error: slotError } = await supabase
    .from('boost_slots')
    .delete()
    .eq('id', slotId);

  if (slotError) {
    console.error('Error deleting slot:', slotError);
    throw new Error('Failed to delete slot');
  }
}

export function formatTimeLeft(endTime: string): string {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const timeLeft = end - now;

  if (timeLeft <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export async function submitAdditionalTime(
  slotId: number,
  amount: number,
  wallet: WalletContextState,
  connection: Connection
): Promise<void> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  // Calculate SOL amount based on USD contribution
  const solAmount = amount;

  // Create and sign transaction
  const transaction = await createContributionTransaction(
    wallet.publicKey,
    solAmount,
    connection
  );
  const signedTransaction = await wallet.signTransaction(transaction);
  
  // Send and confirm transaction
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize()
  );
  await connection.confirmTransaction(signature);

  // Insert contribution record
  const { error: contributionError } = await supabase
    .from('boost_contributions')
    .insert({
      slot_id: slotId,
      wallet_address: wallet.publicKey.toString(),
      amount: amount,
      transaction_signature: signature
    });

  if (contributionError) {
    console.error('Error inserting contribution:', contributionError);
    throw new Error('Failed to record contribution');
  }

  // Update slot end time
  const additionalHours = Math.floor(amount / 0.02);
  
  // First get the current end time
  const { data: currentSlot, error: fetchError } = await supabase
    .from('boost_slots')
    .select('end_time')
    .eq('id', slotId)
    .single();

  if (fetchError) {
    console.error('Error fetching current slot:', fetchError);
    throw new Error('Failed to fetch current slot');
  }

  // Calculate new end time
  const currentEndTime = new Date(currentSlot.end_time);
  const newEndTime = new Date(currentEndTime.getTime() + additionalHours * 60 * 60 * 1000);

  // Update the slot with new end time
  const { error: updateError } = await supabase
    .from('boost_slots')
    .update({
      end_time: newEndTime.toISOString()
    })
    .eq('id', slotId);

  if (updateError) {
    console.error('Error updating slot end time:', updateError);
    throw new Error('Failed to update boost time');
  }
}

async function createContributionTransaction(
  fromPubkey: PublicKey,
  solAmount: number,
  connection: Connection
): Promise<Transaction> {
  const transaction = new Transaction();
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: RECIPIENT_WALLET,
      lamports: BigInt(lamports),
    })
  );
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  return transaction;
}
