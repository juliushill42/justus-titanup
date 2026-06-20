'use client';
import dynamic from 'next/dynamic';
const JustUs = dynamic(() => import('@/components/JustUs'), { ssr: false });
export default function Page() { return <JustUs />; }
