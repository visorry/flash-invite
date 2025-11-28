export function HeroSection() {
  return (
    <section className={'mx-auto max-w-7xl px-[32px] relative flex items-center justify-between mt-16 mb-12'}>
      <div className={'text-center w-full '}>
        <h1 className={'text-[48px] leading-[48px] md:text-[80px] md:leading-[80px] tracking-[-1.6px] font-medium'}>
          Powerful invite management.
          <br />
          Simple pricing.
        </h1>
        <p className={'mt-6 text-[18px] leading-[27px] md:text-[20px] md:leading-[30px] text-muted-foreground'}>
          Manage your Telegram communities with time-limited invites — from small groups to enterprise.
        </p>
        <p className={'mt-4 text-[16px] leading-[24px] md:text-[18px] md:leading-[27px] font-semibold text-blue-600 dark:text-blue-400'}>
          Fully Automate your Telegram Groups
        </p>
      </div>
    </section>
  );
}
