import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { useState } from 'react';

export function LocalizationBanner() {
  const [showBanner, setShowBanner] = useState(true);

  if (!showBanner) {
    return null;
  }

  return (
    <div className={'hidden md:flex border-border/50 border-b-2 bg-background'}>
      <div className={'flex flex-1 justify-center items-center p-2 gap-8'}>
        <div className={'flex items-center gap-4'}>
          <Image src={'/assets/icons/localization-icon.svg'} alt={'Localization Icon'} width={36} height={36} />
          <p className={'text-[16px] font-medium text-center'}>Built for global Telegram communities</p>
        </div>
        <div className={'flex items-center gap-4'}>
          <X size={'16'} className={'cursor-pointer'} onClick={() => setShowBanner(false)} />
        </div>
      </div>
    </div>
  );
}
