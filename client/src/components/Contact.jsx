export default function Contact() {
  return (
    <section id="contact" className="bg-[var(--bg-alt)] py-20">
      <div className="mx-auto w-full max-w-4xl px-6 md:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-soft)]">
            Contact
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[var(--text)] md:text-4xl">
            Get in touch
          </h2>
          <p className="mt-4 text-sm text-[var(--text-muted)] md:text-base">
            Tell us what you need and our team will get back to you fast.
          </p>
        </div>
        <form className="mt-10 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-[var(--text-muted)]">
              Full Name
              <input
                type="text"
                placeholder="John Doe"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
              />
            </label>
            <label className="text-sm text-[var(--text-muted)]">
              Email Address
              <input
                type="email"
                placeholder="john@example.com"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
              />
            </label>
          </div>
          <label className="text-sm text-[var(--text-muted)]">
            Message
            <textarea
              rows="5"
              placeholder="How can we help you?"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>
          <button className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-strong)]">
            Send Message
          </button>
        </form>
      </div>
    </section>
  )
}
