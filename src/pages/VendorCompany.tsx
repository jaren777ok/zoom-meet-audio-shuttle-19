import React from 'react';
import AppNavigation from '@/components/AppNavigation';
import VendorCompanySection from '@/components/VendorCompanySection';

const VendorCompany: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <AppNavigation />
      <div className="max-w-4xl mx-auto">
        <VendorCompanySection />
      </div>
    </div>
  );
};

export default VendorCompany;