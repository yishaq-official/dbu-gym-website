function ApparatusIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
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

const apparatusItems = [
  {
    title: 'Free Weights',
    description: 'Dumbbells up to 150lbs, Olympic barbells, and calibrated plates.',
    icon: (
      <ApparatusIcon>
        <path d="M3 10v4" />
        <path d="M7 8v8" />
        <path d="M17 8v8" />
        <path d="M21 10v4" />
        <rect x="9" y="10" width="6" height="4" rx="2" />
      </ApparatusIcon>
    ),
  },
  {
    title: 'Cardio Zone',
    description: 'Latest treadmills, stair masters, and rowers with screens.',
    icon: (
      <ApparatusIcon>
        <path d="M5 18h14" />
        <path d="M7 18l4-10 4 10" />
        <circle cx="17.5" cy="7.5" r="2.5" />
      </ApparatusIcon>
    ),
  },
  {
    title: 'Cable Machines',
    description: 'Functional trainers to target every muscle group safely.',
    icon: (
      <ApparatusIcon>
        <path d="M6 3v18" />
        <path d="M18 3v18" />
        <path d="M6 7h12" />
        <path d="M9 21v-6" />
        <path d="M15 21v-6" />
      </ApparatusIcon>
    ),
  },
  {
    title: 'Calisthenics',
    description: 'Pull-up bars and dip stations for bodyweight mastery.',
    icon: (
      <ApparatusIcon>
        <path d="M4 6h16" />
        <path d="M6 6v12" />
        <path d="M18 6v12" />
        <path d="M12 10v8" />
        <path d="M9 14h6" />
      </ApparatusIcon>
    ),
  },
  {
    title: 'Combat Zone',
    description: 'Heavy bags and a boxing ring for high-intensity conditioning.',
    icon: (
      <ApparatusIcon>
        <path d="M9 4h6" />
        <path d="M10 4v3" />
        <path d="M14 4v3" />
        <rect x="8" y="7" width="8" height="12" rx="3" />
      </ApparatusIcon>
    ),
  },
  {
    title: 'Recovery',
    description: 'Massage guns and saunas for post-workout care.',
    icon: (
      <ApparatusIcon>
        <path d="M4 14h16" />
        <path d="M6 14c0-3 3-6 6-6s6 3 6 6" />
        <path d="M8 18h8" />
      </ApparatusIcon>
    ),
  },
]

export default function Apparatus() {
  return (
    <section id="apparatus" className="bg-[var(--bg-alt)] py-20">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-soft)]">
            Apparatus
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[var(--text)] md:text-4xl">
            World-class apparatus
          </h2>
          <p className="mt-4 text-sm text-[var(--text-muted)] md:text-base">
            Train with the best equipment industry standards have to offer.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apparatusItems.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-2 hover:border-[var(--accent)] card-sheen"
            >
              <div className="apparatus-icon flex h-12 w-12 items-center justify-center rounded-xl">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
