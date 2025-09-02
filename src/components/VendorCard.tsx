import React from 'react';
import { VendorProfileCard } from './VendorProfileCard';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';

interface VendorCardProps {
  vendor: VendorMetrics;
  rank?: number;
  onViewDetails: (vendorId: string) => void;
  onViewSessionDetails?: (sessionId: string) => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, rank, onViewDetails, onViewSessionDetails }) => {
  return (
    <VendorProfileCard 
      vendor={vendor}
      onViewDetails={onViewDetails}
      onViewSessionDetails={onViewSessionDetails}
    />
  );
};

export default VendorCard;