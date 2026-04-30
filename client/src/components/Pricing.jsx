const pricingPlans = [
  {
    name: 'Day Pass',
    price: '15 ETB',
    term: '/day',
    description: 'Perfect for travelers.',
    perks: ['Single Day Access', 'Locker Room Access', 'No Guest Pass'],
    cta: 'Get Day Pass',
  },
  {
    name: 'Monthly',
    price: '800 ETB',
    term: '/month',
    description: 'Flexible commitment.',
    perks: ['24/7 Gym Access', 'Free Group Classes', '1 Guest Pass/mo'],
    cta: 'Join Monthly',
    featured: true,
  },
  {
    name: 'Yearly',
    price: '8000 ETB',
    term: '/year',
    description: "Save 2 months' fees.",
    perks: ['All Monthly Perks', 'Private Intro Session', 'Unlimited Guest Passes'],
    cta: 'Go Yearly',
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[var(--bg)] py-20">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-soft)]">
            Pricing
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[var(--text)] md:text-4xl">
            Choose your plan
          </h2>
          <p className="mt-4 text-sm text-[var(--text-muted)] md:text-base">
            Flexible options for every training style.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-6 py-5 text-sm text-[var(--text-muted)] glow-ring">
          <span className="font-semibold text-[var(--text)]">Staff member?</span>{' '}
          Log in with your employee or student ID to apply a 20% discount.
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative flex h-full flex-col overflow-hidden rounded-2xl p-8 text-left transition hover:-translate-y-2 card-sheen ${
                plan.featured ? 'featured glow-ring' : ''
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
                  Best Value
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-[var(--text)]">
                {plan.name}
              </h3>
              <p className="price mt-3 font-semibold text-[var(--text)]">
                {plan.price}
                <span className="ml-2 text-sm font-normal text-[var(--text-soft)]">
                  {plan.term}
                </span>
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--text-muted)]">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <span className="text-[var(--accent)]">•</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <button className="w-full rounded-full border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-black">
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
