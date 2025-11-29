import { Separator } from '@/components/ui/separator';

export function PoweredByPaddle() {
  return (
    <>
      <Separator className={'footer-border'} />
      <div
        className={
          'flex flex-col justify-center items-center gap-2 text-muted-foreground text-sm leading-[14px] py-[24px]'
        }
      >
        <div className={'flex justify-center items-center gap-2'}>
          <span className={'text-sm leading-[14px]'}>Flash Invite</span>
        </div>
        <div className={'flex justify-center items-center gap-2 flex-wrap md:flex-nowrap'}>
          <span className={'text-sm leading-[14px]'}>
            &copy; {new Date().getFullYear()} All rights reserved
          </span>
        </div>
      </div>
    </>
  );
}
