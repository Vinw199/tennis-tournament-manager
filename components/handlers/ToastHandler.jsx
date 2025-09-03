'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check for a 'message' in the URL query parameters
    const message = searchParams.get('message');
    if (message) {
      // Replace underscores with spaces for a cleaner look
      const formattedMessage = message.replace(/_/g, ' ');
      toast.success(formattedMessage);
      
      // Clean the URL by removing the query parameter
      // This prevents the toast from re-appearing on a page refresh
      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false });
    }
  }, [searchParams, router]);

  // This component does not render any visible UI
  return null;
}