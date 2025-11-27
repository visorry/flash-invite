import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <>
      <div className={'mx-auto max-w-7xl text-center px-8 mt-24 mb-24'}>
        <span className={'text-base'}>Built for the Telegram community</span>
      </div>
      <Separator className={'footer-border'} />
      <div
        className={
          'flex flex-col justify-center items-center gap-2 text-muted-foreground text-sm leading-[14px] py-[24px]'
        }
      >
        <div className={'flex justify-center items-center gap-2'}>
          <span className={'text-sm leading-[14px]'}>FlashInvite - Powered by Super Invite</span>
        </div>
      </div>
    </>
  );
}
