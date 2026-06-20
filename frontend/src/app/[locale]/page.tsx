'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Code-split the main app component
const JustUs = dynamic(() => import('@/components/JustUs'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-white text-center">
        <div className="animate-pulse mb-4">Loading JustUs Platform...</div>
      </div>
    </div>
  ),
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <JustUs />
    </Suspense>
  );
}
