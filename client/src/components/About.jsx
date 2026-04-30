export default function About() {
  return (
    <section id="about" className="bg-[var(--bg)] py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-8">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-soft)]">
            About Us
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[var(--text)] md:text-4xl">
            Built to support your strongest goals.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
            At Dbu-Gym, we believe fitness is not just a hobby, but a lifestyle.
            We have helped thousands of members achieve their physical and mental
            potential with 24/7 access, expert trainers, and a welcoming
            community.
          </p>
          <div className="mt-8 space-y-3 text-sm text-[var(--text-muted)]">
            {['Certified Trainers', 'Modern Equipment', 'Personalized Programs'].map(
              (item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)] animate-pulse-glow">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </div>
        <div className="relative animate-float">
          <div className="absolute -inset-4 rounded-3xl border border-[var(--border)]" />
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            alt="Gym Trainer"
            className="relative w-full rounded-3xl object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  )
}
