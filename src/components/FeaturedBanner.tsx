import { BoostSlot } from '@/components/boost/Boost';
import { useState, useEffect } from 'react';

interface FeaturedBannerProps {
  slots: BoostSlot[];
}

export const FeaturedBanner = ({ slots }: FeaturedBannerProps) => {
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    originalUrl?: string;
    urlType?: string;
    urlLength?: number;
  }>({});

  // Get the first featured slot with a project
  const featuredSlot = slots.find(slot => slot.project_name && slot.project_logo);

  useEffect(() => {
    if (featuredSlot?.project_logo) {
      const url = featuredSlot.project_logo;
      setDebugInfo({
        originalUrl: url,
        urlType: typeof url,
        urlLength: url.length
      });

      // Validate data URL
      if (url.startsWith('data:image')) {
        try {
          // Basic validation of data URL
          new URL(url);
        } catch (error) {
          console.error('Invalid data URL format:', {
            url,
            error: error.message
          });
          setImageError(true);
        }
      }
    }
  }, [featuredSlot]);

  if (!featuredSlot) {
    return null;
  }

  const imageUrl = featuredSlot.project_logo;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image Loading Error Details:', {
      src: imageUrl,
      projectName: featuredSlot.project_name,
      debugInfo,
      errorEvent: e
    });
    setImageError(true);
  };

  return (
    <div className="relative w-full h-[300px] overflow-hidden">
      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 bg-red-100 p-2 z-50 text-xs">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: imageError ? 'none' : `url(${imageUrl})`,
          backgroundColor: imageError ? 'rgba(0,0,0,0.1)' : 'transparent',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: 0.3
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 relative">
            {!imageError ? (
              <img
                src={imageUrl}
                alt={featuredSlot.project_name}
                className="w-full h-full rounded-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-crypto-primary/10 rounded-full flex items-center justify-center text-4xl">
                {featuredSlot.project_name.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {featuredSlot.project_name}
          </h2>
          <div className="flex space-x-4">
            {featuredSlot.project_link && (
              <a
                href={featuredSlot.project_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Visit Website
              </a>
            )}
            {featuredSlot.telegram_link && (
              <a
                href={featuredSlot.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Join Telegram
              </a>
            )}
          </div>
          {/* Contribution Stats */}
          <div className="flex items-center space-x-8 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-crypto-primary">
                {featuredSlot.total_contributions ? Number(featuredSlot.total_contributions).toFixed(2) : '0.00'} SOL
              </p>
              <p className="text-sm text-gray-400">Total Contributions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-crypto-primary">
                {featuredSlot.contributor_count || 0}
              </p>
              <p className="text-sm text-gray-400">Contributors</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-crypto-primary">
                {featuredSlot.total_hours ? Math.round(featuredSlot.total_hours) : 0}
              </p>
              <p className="text-sm text-gray-400">Total Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
