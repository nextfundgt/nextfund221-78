import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useMarketingBanners } from '@/hooks/useMarketingBanners';

export function MarketingBanner() {
  const { banners, loading } = useMarketingBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleBannerClick = () => {
    if (currentBanner.link_url) {
      window.open(currentBanner.link_url, '_blank');
    }
  };

  return (
    <Card className="glass-card border-border/50 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-0 relative">
        {currentBanner.image_url && (
          <div 
            className="h-32 md:h-40 bg-cover bg-center relative rounded-t-2xl"
            style={{ 
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${currentBanner.image_url})` 
            }}
          >
            <div className="absolute inset-0 flex items-end p-4">
              <div className="text-white">
                <h3 className="text-lg md:text-xl font-bold mb-1">
                  {currentBanner.title}
                </h3>
                {currentBanner.description && (
                  <p className="text-sm opacity-90 mb-3">
                    {currentBanner.description}
                  </p>
                )}
                <Button 
                  onClick={handleBannerClick}
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                >
                  {currentBanner.button_text}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {!currentBanner.image_url && (
          <div className="p-6 text-center">
            <h3 className="text-lg md:text-xl font-bold text-primary mb-2">
              {currentBanner.title}
            </h3>
            {currentBanner.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {currentBanner.description}
              </p>
            )}
            <Button 
              onClick={handleBannerClick}
              variant="outline" 
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              {currentBanner.button_text}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Navigation controls */}
        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevBanner}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextBanner}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}