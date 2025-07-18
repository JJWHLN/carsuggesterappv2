import React from 'react';
import { UnifiedAuthScreen } from '@/components/auth/UnifiedAuthScreen';

export default function SignInScreen() {
  return (
    <UnifiedAuthScreen 
      mode="sign-in"
      showSocialLogin={true}
    />
  );
}
