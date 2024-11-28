import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { submitAdditionalTime } from './BoostUtils';
import type { BoostSlot } from './Boost';

interface BoostContributionFormProps {
  slot: BoostSlot;
  onSuccess?: () => void;
}

export function BoostContributionForm({ slot, onSuccess }: BoostContributionFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contribution, setContribution] = useState(0.02); // Start with minimum 0.02 SOL

  // Calculate available time
  const currentBoostHours = Math.ceil(
    (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60 * 60)
  );
  const remainingHours = 48 - currentBoostHours;
  const maxContribution = remainingHours * 0.02; // 0.02 SOL per hour

  const handleContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : Number(value);
    
    if (numValue > maxContribution) {
      toast({
        title: 'Maximum Time Exceeded',
        description: `Maximum additional contribution is ${maxContribution.toFixed(3)} SOL (${remainingHours} hours)`,
        variant: 'destructive',
      });
      setContribution(maxContribution);
    } else {
      setContribution(numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (contribution < 0.02) {
      toast({
        title: 'Error',
        description: 'Minimum contribution is 0.02 SOL',
        variant: 'destructive',
      });
      return;
    }

    if (contribution > maxContribution) {
      toast({
        title: 'Error',
        description: `Maximum additional contribution is ${maxContribution.toFixed(3)} SOL (${remainingHours} hours)`,
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
        connection
      );

      const additionalHours = Math.floor(contribution * 50); // 0.02 SOL = 1 hour
      
      toast({
        title: 'Success!',
        description: `Added ${additionalHours} hours of boost time!`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit contribution',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contribution">
          Contribution Amount (SOL) - {Math.floor(contribution * 50)} hours
        </Label>
        <Input
          id="contribution"
          type="number"
          min={0.02}
          max={maxContribution}
          step={0.02}
          value={contribution}
          onChange={handleContributionChange}
          disabled={isSubmitting}
          required
        />
        <p className="text-sm text-gray-500">
          {`Minimum: 0.02 SOL (1 hour) - Maximum: ${maxContribution.toFixed(3)} SOL (${remainingHours} hours)`}
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Processing...' : 'Add Time'}
      </Button>
    </form>
  );
}
