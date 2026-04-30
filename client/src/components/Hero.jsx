function StatIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export default function Hero() {
  return (
    <section
      id="home"
      className="hero-dark relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
        <p className="hero-pill mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] animate-fade-up">
          Stronger Every Day
        </p>
        <h1 className="hero-title font-display text-4xl font-semibold leading-tight tracking-wide md:text-6xl animate-fade-up">
          Build Your <span className="text-[var(--accent)]">Dream Body</span>
        </h1>
        <p className="hero-subtitle mt-5 max-w-2xl text-base md:text-lg animate-fade-up">
          State of the art equipment, expert trainers, and a community that
          supports your goals. Train smarter, recover faster, and show up for
          the strongest version of yourself.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-up">
          <a
            href="#pricing"
            className="hero-cta rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:translate-y-[-2px] hover:bg-[var(--accent-strong)]"
          >
            Join Now
          </a>
          <a
            href="#about"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
          >
            Explore The Gym
          </a>
        </div>
        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            {
              label: '24/7 Access',
              value: 'Anytime',
              icon: (
                <StatIcon>
                  <path d="M12 8v4l2 2" />
                  <circle cx="12" cy="12" r="7" />
                </StatIcon>
              ),
            },
            {
              label: 'Certified Coaches',
              value: '12+',
              icon: (
                <StatIcon>
                  <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.6-4.9-2.7-4.9 2.7.9-5.6-4-3.9L9.5 8z" />
                </StatIcon>
              ),
            },
            {
              label: 'Member Community',
              value: '2,500+',
              icon: (
                <StatIcon>
                  <circle cx="8" cy="9" r="3" />
                  <circle cx="16" cy="9" r="3" />
                  <path d="M3 19c0-3 3-5 5-5" />
                  <path d="M21 19c0-3-3-5-5-5" />
                </StatIcon>
              ),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="stat-card rounded-2xl p-5 backdrop-blur animate-fade-up"
            >
              <div className="flex items-center justify-between">
                <span className="stat-card-icon flex h-10 w-10 items-center justify-center rounded-full">
                  {item.icon}
                </span>
                <span className="text-2xl font-semibold text-white">
                  {item.value}
                </span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/70">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
