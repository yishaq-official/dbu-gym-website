import { membershipPackages } from '../lib/pricing'

export default function Pricing() {
  return (
    <section id="pricing" className="bg-[var(--bg)] py-20">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-soft)]">
            Pricing
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[var(--text)] md:text-4xl">
            4 Training Packages, Clear Campus Pricing
          </h2>
          <p className="mt-4 text-sm text-[var(--text-muted)] md:text-base">
            Internal and external rates for every member level, from dumbbells to VIP.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] px-6 py-5 text-sm text-[var(--text-muted)] glow-ring">
          <span className="font-semibold text-[var(--text)]">Inside university</span>{' '}
          users enjoy reduced internal pricing. External users pay standard public rates.
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {membershipPackages.map((plan) => (
            <div
              key={plan.key}
              className={`pricing-card relative flex h-full flex-col overflow-hidden rounded-2xl p-8 text-left transition hover:-translate-y-2 card-sheen ${
                plan.featured ? 'featured glow-ring' : ''
              }`}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
                  VIP
                </span>
              ) : null}

              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-3xl bg-[var(--accent)]/15 text-3xl">
                  {plan.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                    {plan.name}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-5 text-sm text-[var(--text)] shadow-sm">
                {Object.entries(plan.prices).map(([label, amount]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-3">
                    <span className="font-medium text-[var(--text-soft)]">{label}</span>
                    <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-sm font-semibold text-[var(--accent)]">
                      {amount}
                    </span>
                  </div>
                ))}
              </div>

              <ul className="mt-6 space-y-3 text-sm text-[var(--text-muted)]">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-3">
                    <span className="text-[var(--accent)]">✓</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <button className="w-full rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-black">
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
