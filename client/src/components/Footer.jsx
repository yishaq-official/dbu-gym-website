function SocialIcon({ path, label }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </a>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
          <p className="font-display text-2xl font-semibold tracking-wide text-[var(--text)]">
            <span className="text-[var(--accent)]">DBU</span>GYM
          </p>
          <p className="mt-3 max-w-sm text-sm text-[var(--text-muted)]">
            Making the world stronger, one rep at a time. Come for the
            equipment, stay for the community.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <SocialIcon
              label="Facebook"
              path="M13 10h3m-3 8V7.5a2.5 2.5 0 0 1 2.5-2.5H17"
            />
            <SocialIcon
              label="Instagram"
              path="M16.5 7.5h.01M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"
            />
            <SocialIcon
              label="Twitter"
              path="M4 5l7.5 7.5L19 5M6.5 18.5l5-5 5 5"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
            Quick Links
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--text-muted)]">
            <a href="#about" className="transition hover:text-[var(--accent)]">
              About
            </a>
            <a href="#apparatus" className="transition hover:text-[var(--accent)]">
              Apparatus
            </a>
            <a href="#pricing" className="transition hover:text-[var(--accent)]">
              Pricing
            </a>
            <a href="#contact" className="transition hover:text-[var(--accent)]">
              Contact
            </a>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
            Hours
          </p>
          <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            <p>Mon - Fri: 5:00 AM - 11:00 PM</p>
            <p>Saturday: 6:00 AM - 10:00 PM</p>
            <p>Sunday: 7:00 AM - 9:00 PM</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
            Contact
          </p>
          <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
            <p>Tebase, Debre Berhan</p>
            <p>+251 932 123 456</p>
            <p>info@dbugym.com</p>
          </div>
          <form className="mt-5 flex items-center gap-2">
            <input
              type="email"
              placeholder="Email for offers"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="button"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[var(--accent-strong)]"
            >
              Join
            </button>
          </form>
        </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-soft)]">
        © 2025 Dbu-Gym. All rights reserved.
      </div>
    </footer>
  )
}
