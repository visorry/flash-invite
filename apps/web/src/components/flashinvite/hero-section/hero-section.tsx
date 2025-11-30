export function HeroSection() {
  return (
    <section className={'mx-auto max-w-7xl px-[32px] relative flex items-center justify-between mt-16 mb-12'}>
      <div className={'text-center w-full '}>
        <h1 className={'text-[48px] leading-[48px] md:text-[80px] md:leading-[80px] tracking-[-1.6px] font-medium'}>
          Fully Automate your
          <br />
          Telegram Groups
        </h1>
        <p className={'mt-6 text-[18px] leading-[27px] md:text-[20px] md:leading-[30px] text-muted-foreground'}>
          Manage Telegram communities with time-limited invites. Fully automate groups & channels — generate subscription links, auto-approve members, and control access by time or plan.
        </p>
        <div className={'mt-8 flex items-center justify-center'}>
          <a
            href="/login"
            className={'inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'}
          >
            Get started for free
          </a>
        </div>
      </div>
    </section>
  );
}
