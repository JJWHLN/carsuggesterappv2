import React from 'react';
import { UnifiedAuthScreen } from '@/components/auth/UnifiedAuthScreen';

export default function SignUpScreen() {
  return (
    <UnifiedAuthScreen 
      mode="sign-up"
      showSocialLogin={true}
    />
  );
}
