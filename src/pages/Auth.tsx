import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AccountTypeSelector from '@/components/AccountTypeSelector';
import AuthCompany from '@/pages/AuthCompany';
import AuthVendedor from '@/pages/AuthVendedor';

type AuthStep = 'selection' | 'empresa' | 'vendedor';

const Auth = () => {
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>('selection');

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleAccountTypeSelect = (type: 'empresa' | 'vendedor') => {
    setCurrentStep(type);
  };

  const handleBack = () => {
    setCurrentStep('selection');
  };

  // Render different components based on current step
  if (currentStep === 'selection') {
    return <AccountTypeSelector onSelectType={handleAccountTypeSelect} />;
  }

  if (currentStep === 'empresa') {
    return <AuthCompany onBack={handleBack} />;
  }

  if (currentStep === 'vendedor') {
    return <AuthVendedor onBack={handleBack} />;
  }

  return null;
};

export default Auth;