import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Props {
  user: any;
}

export default function Header({ user }: Props) {
  return (
    <nav>
      <div className="mx-auto max-w-7xl relative px-[32px] py-[18px] flex items-center justify-between">
        <div className="flex flex-1 items-center justify-start">
          <Link className="flex items-center gap-2 sm:gap-3" href={'/'}>
            <Image
              src="/favicon/icon-96x96.png"
              alt="Flash Invite Logo"
              width={32}
              height={32}
              className="rounded-lg sm:w-10 sm:h-10"
            />
            <span className="text-lg sm:text-2xl font-bold">Flash Invite</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <div className="flex space-x-4">
            {user?.id ? (
              <Button variant={'secondary'} asChild={true}>
                <Link href={'/dashboard'}>Dashboard</Link>
              </Button>
            ) : (
              <Button asChild={true} variant={'secondary'}>
                <Link href={'/login'}>Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
