import { Check } from 'lucide-react';

interface ParallaxSectionProps {
  imageUrl: string;
  children?: React.ReactNode;
}

export function ParallaxSection({ imageUrl, children }: ParallaxSectionProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Static Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#131c3b]/80" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

const bulletPoints = [
  'Next-day delivery',
  'Designed specifically for real estate',
  'Full marketing kit included every time',
  'Consistent, professional branding',
  'Easy booking process',
];

export function WhyRealtorsSection() {
  return (
    <ParallaxSection imageUrl="https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/calgary.webp">
      <div className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            Built for Calgary Realtors
          </h2>
          <div className="grid gap-4 max-w-xl mx-auto">
            {bulletPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ca4153] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-lg font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ParallaxSection>
  );
}

