import React from 'react';
import { VendorProfileCard } from './VendorProfileCard';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';

interface VendorCardProps {
  vendor: VendorMetrics;
  rank?: number;
  onViewDetails: (vendorId: string) => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, rank, onViewDetails }) => {
  return (
    <VendorProfileCard 
      vendor={vendor}
      onViewDetails={onViewDetails}
    />
  );
};

export default VendorCard;