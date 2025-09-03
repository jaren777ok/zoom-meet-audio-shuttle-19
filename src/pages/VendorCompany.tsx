import React from 'react';
import AppNavigation from '@/components/AppNavigation';
import VendorCompanySection from '@/components/VendorCompanySection';
import Silk from '@/components/Silk';

const VendorCompany: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Silk
          speed={5}
          scale={1}
          color="#172B7D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="relative z-10 p-4">
        <AppNavigation />
        <div className="max-w-6xl mx-auto">
          <VendorCompanySection />
        </div>
      </div>
    </div>
  );
};

export default VendorCompany;