'use client';
import { useRouter, usePathname } from 'next/navigation';
export default function LanguageSwitcher() {
  const router = useRouter(); const pathname = usePathname();
  return (
    <div className="flex gap-1.5">
      {['en', 'es'].map(loc => (
        <button key={loc} onClick={() => { const segs = pathname.split('/'); segs[1] = loc; router.push(segs.join('/')); }} className="text-[10px] font-mono border border-white/10 px-2.5 py-1 rounded-lg text-white/60 hover:text-white bg-transparent cursor-pointer">
          {loc}
        </button>
      ))}
    </div>
  );
}
