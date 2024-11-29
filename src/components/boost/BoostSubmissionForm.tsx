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
import { ImagePlus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface BoostSubmissionFormProps {
  onSuccess?: () => void;
  existingSlot?: BoostSlot;
}

export function BoostSubmissionForm({ onSuccess, existingSlot }: BoostSubmissionFormProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();
  
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Error loading image:', {
      src: formData.projectLogo,
      projectName: formData.projectName,
      error: e
    });
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    target.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({
        ...prev,
        projectLogo: dataUrl
      }));
    };
    reader.readAsDataURL(file);
  };

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
      
      setFormData(prev => ({ ...prev, totalContributions: numValue }));
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
      
      // Validate required fields
      if (!formData.projectName.trim()) {
        throw new Error("Project name is required");
      }

      // Get the project logo URL - could be a data:image or a regular URL
      const projectLogoUrl = formData.projectLogo;
      let formattedProjectLink;
      let formattedTelegramLink;
      let formattedChartLink;

      try {
        formattedProjectLink = formatUrl(formData.projectLink);
        formattedTelegramLink = formData.telegramLink ? formatUrl(formData.telegramLink) : null;
        formattedChartLink = formData.chartLink ? formatUrl(formData.chartLink) : null;
      } catch (error) {
        console.error('URL validation error:', error);
        toast({
          title: "Invalid URL",
          description: error.message || "Please enter valid URLs",
          variant: "destructive",
        });
        return;
      }

      const submission: ProjectSubmission = {
        project_name: formData.projectName.trim(),
        project_logo: projectLogoUrl,
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
    <>
      {isMobile ? (
        // Mobile Form
        <form onSubmit={handleSubmit} className="space-y-3 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={handleChange}
              placeholder="e.g., CryptoSquares"
              disabled={!!existingSlot}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectLogo">Project Logo URL</Label>
            <div className="space-y-2">
              <Input
                id="projectLogo"
                type="url"
                value={formData.projectLogo}
                onChange={handleChange}
                placeholder="e.g., https://example.com/logo.png"
                disabled={!!existingSlot}
                className="h-9"
              />
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  isDragging ? "border-crypto-primary bg-crypto-primary/10" : "border-crypto-primary/20 hover:border-crypto-primary/40",
                  "relative"
                )}
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <p className="text-sm text-gray-400">
                  Drag and drop an image here, or click to select
                </p>
                <div className="flex-1 flex flex-col items-center justify-center">
                  {formData.projectLogo ? (
                    <>
                      <img
                        src={formData.projectLogo}
                        alt={formData.projectName}
                        className="w-16 h-16 object-contain rounded-lg"
                        onError={handleImageError}
                      />
                      <div className="fallback hidden w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                        {formData.projectName.charAt(0)}
                      </div>
                    </>
                  ) : (
                    <div className="w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                      {formData.projectName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectLink">Project Website</Label>
            <Input
              id="projectLink"
              value={formData.projectLink}
              onChange={handleChange}
              placeholder="e.g., cryptosquares.com"
              disabled={!!existingSlot}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telegramLink">Telegram Link</Label>
            <Input
              id="telegramLink"
              value={formData.telegramLink}
              onChange={handleChange}
              placeholder="e.g., t.me/yourgroup"
              disabled={!!existingSlot}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chartLink">Chart Link</Label>
            <Input
              id="chartLink"
              value={formData.chartLink}
              onChange={handleChange}
              placeholder="e.g., dexscreener.com/yourtoken"
              disabled={!!existingSlot}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="totalContributions">Contribution Amount (SOL)</Label>
            <Input
              id="totalContributions"
              type="number"
              step="0.02"
              min="0.02"
              max={existingSlot ? maxContribution : 0.96}
              value={formData.totalContributions}
              onChange={handleChange}
              className="h-9"
            />
            <div className="text-xs text-gray-500">
              0.02 SOL per hour, maximum 48 hours ({(formData.totalContributions / 0.02).toFixed(1)} hours)
            </div>
          </div>

          <Button type="submit" className="w-full h-9 mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : existingSlot ? "Add More Time" : "Submit"}
          </Button>
        </form>
      ) : (
        // Desktop Form
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={handleChange}
              placeholder="e.g., CryptoSquares"
              disabled={!!existingSlot}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectLogo">Project Logo URL</Label>
            <div className="space-y-2">
              <Input
                id="projectLogo"
                type="url"
                value={formData.projectLogo}
                onChange={handleChange}
                placeholder="e.g., https://example.com/logo.png"
                disabled={!!existingSlot}
              />
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  isDragging ? "border-crypto-primary bg-crypto-primary/10" : "border-crypto-primary/20 hover:border-crypto-primary/40",
                  "relative"
                )}
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <p className="text-sm text-gray-400">
                  Drag and drop an image here, or click to select
                </p>
                <div className="flex-1 flex flex-col items-center justify-center">
                  {formData.projectLogo ? (
                    <>
                      <img
                        src={formData.projectLogo}
                        alt={formData.projectName}
                        className="w-16 h-16 object-contain rounded-lg"
                        onError={handleImageError}
                      />
                      <div className="fallback hidden w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                        {formData.projectName.charAt(0)}
                      </div>
                    </>
                  ) : (
                    <div className="w-16 h-16 bg-crypto-primary/10 rounded-lg flex items-center justify-center">
                      {formData.projectName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectLink">Project Website</Label>
            <Input
              id="projectLink"
              value={formData.projectLink}
              onChange={handleChange}
              placeholder="e.g., cryptosquares.com"
              disabled={!!existingSlot}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramLink">Telegram Link</Label>
            <Input
              id="telegramLink"
              value={formData.telegramLink}
              onChange={handleChange}
              placeholder="e.g., t.me/yourgroup"
              disabled={!!existingSlot}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chartLink">Chart Link</Label>
            <Input
              id="chartLink"
              value={formData.chartLink}
              onChange={handleChange}
              placeholder="e.g., dexscreener.com/yourtoken"
              disabled={!!existingSlot}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalContributions">Contribution Amount (SOL)</Label>
            <Input
              id="totalContributions"
              type="number"
              step="0.02"
              min="0.02"
              max={existingSlot ? maxContribution : 0.96}
              value={formData.totalContributions}
              onChange={handleChange}
            />
            <div className="text-sm text-gray-500">
              0.02 SOL per hour, maximum 48 hours ({(formData.totalContributions / 0.02).toFixed(1)} hours)
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : existingSlot ? "Add More Time" : "Submit"}
          </Button>
        </form>
      )}
    </>
  );
}

function calculateBoostTime(solAmount: number): number {
  return Math.floor(solAmount * 50); // 50 hours per SOL (0.02 SOL per hour)
}
