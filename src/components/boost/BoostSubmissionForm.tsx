import * as React from 'react';
import { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProjectSubmission, submitBoostProject, submitAdditionalTime } from './BoostUtils';
import type { BoostSlot } from './Boost';
import { formatUrl } from "@/lib/url";

interface BoostSubmissionFormProps {
  onSuccess?: () => void;
  existingSlot?: BoostSlot;
}

export function BoostSubmissionForm({ onSuccess, existingSlot }: BoostSubmissionFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate remaining available time if this is an additional contribution
  const currentBoostHours = existingSlot
    ? Math.ceil((new Date(existingSlot.end_time).getTime() - new Date(existingSlot.start_time).getTime()) / (1000 * 60 * 60))
    : 0;
  const remainingHours = 48 - currentBoostHours;
  const maxContribution = remainingHours * 0.02; // 0.02 SOL per hour

  // Form state
  const [formData, setFormData] = useState({
    projectName: existingSlot?.project_name || '',
    projectLogo: existingSlot?.project_logo || '',
    projectLink: existingSlot?.project_link || '',
    telegramLink: existingSlot?.telegram_link || '',
    chartLink: existingSlot?.chart_link || '',
    totalContributions: 0.02 // Minimum 0.02 SOL
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'totalContributions') {
      let numValue = value === '' ? 0 : Number(value);
      
      if (numValue > 0.96) { // 0.96 SOL = 48 hours at 0.02 SOL/hour
        toast({
          title: 'Maximum Time Exceeded',
          description: 'Maximum boost time is 48 hours (0.96 SOL)',
          variant: 'destructive',
        });
        numValue = 0.96;
      }
      
      setFormData(prev => ({ ...prev, [id]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
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

    // Validate contribution amount
    if (formData.totalContributions < 0.02) {
      toast({
        title: 'Error',
        description: 'Minimum contribution is 0.02 SOL',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!formData.projectName || !formData.projectLink) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Format URLs
      const formattedProjectLink = formatUrl(formData.projectLink);
      const formattedTelegramLink = formData.telegramLink ? formatUrl(formData.telegramLink) : '';
      const formattedChartLink = formData.chartLink ? formatUrl(formData.chartLink) : '';

      const submission: ProjectSubmission = {
        project_name: formData.projectName,
        project_logo: formData.projectLogo,
        project_link: formattedProjectLink,
        telegram_link: formattedTelegramLink || undefined,
        chart_link: formattedChartLink || undefined,
        initial_contribution: formData.totalContributions
      };

      if (existingSlot) {
        await submitAdditionalTime(
          existingSlot.id,
          formData.totalContributions,
          wallet,
          connection
        );
      } else {
        await submitBoostProject(submission, wallet, connection);
      }

      toast({
        title: 'Success!',
        description: existingSlot
          ? 'Successfully added boost time!'
          : 'Successfully submitted project!',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit project',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectName">Project Name</Label>
        <Input
          id="projectName"
          value={formData.projectName}
          onChange={handleChange}
          disabled={isSubmitting || !!existingSlot}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectLogo">Project Logo URL</Label>
        <Input
          id="projectLogo"
          value={formData.projectLogo}
          onChange={handleChange}
          disabled={isSubmitting || !!existingSlot}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectLink">Project Website</Label>
        <Input
          id="projectLink"
          value={formData.projectLink}
          onChange={handleChange}
          disabled={isSubmitting || !!existingSlot}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telegramLink">Telegram Link (Optional)</Label>
        <Input
          id="telegramLink"
          value={formData.telegramLink}
          onChange={handleChange}
          disabled={isSubmitting || !!existingSlot}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="chartLink">Chart Link (Optional)</Label>
        <Input
          id="chartLink"
          value={formData.chartLink}
          onChange={handleChange}
          disabled={isSubmitting || !!existingSlot}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalContributions">
          Contribution Amount (SOL) - {calculateBoostTime(formData.totalContributions)} hours
        </Label>
        <Input
          id="totalContributions"
          type="number"
          min={0.02}
          max={existingSlot ? maxContribution : 0.96}
          step={0.02}
          value={formData.totalContributions}
          onChange={handleChange}
          disabled={isSubmitting}
          required
        />
        <p className="text-sm text-gray-500">
          {existingSlot ? (
            `Maximum additional contribution: ${maxContribution.toFixed(3)} SOL (${remainingHours} hours)`
          ) : (
            'Minimum: 0.02 SOL (1 hour) - Maximum: 0.96 SOL (48 hours)'
          )}
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : existingSlot ? 'Add Time' : 'Submit Project'}
      </Button>
    </form>
  );
}

function calculateBoostTime(solAmount: number): number {
  return Math.floor(solAmount * 50); // 50 hours per SOL (0.02 SOL per hour)
}
