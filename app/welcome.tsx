import React from 'react';
import { router } from 'expo-router';
import { WelcomeScreen } from '@/components/ui/WelcomeScreen';

export default function Welcome() {
  const handleGetStarted = () => {
    // Go to onboarding for personalized experience
    router.push('/preferences/onboarding');
  };

  const handleBrowseAnonymous = () => {
    // Go directly to main app without onboarding
    router.replace('/(tabs)');
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  return (
    <WelcomeScreen 
      onGetStarted={handleGetStarted}
      onBrowseAnonymous={handleBrowseAnonymous}
      onSignIn={handleSignIn}
    />
  );
}
