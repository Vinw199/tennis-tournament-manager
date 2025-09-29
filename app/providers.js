'use client';

import { ProgressProvider } from '@bprogress/next/app';

const Providers = ({ children }) => {
  return (
    <ProgressProvider
      height="3px"
      color="#3a8f34"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};

export default Providers;