import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

const sections = [
  {
    id: 'intro',
    title: 'Introduction',
    body: [
      "Welcome to DBU Gym. These Terms and Conditions (\"Terms\") govern your access to the DBU Gym website, membership portal, and physical facilities.",
      'By registering, submitting a form, or completing payment, you agree to these Terms. If you do not agree, please do not use the services.',
    ],
  },
  {
    id: 'membership',
    title: '1. Membership Registration and Account Security',
    body: [
      'Membership is available to University Members (students/staff) and External Members (general public).',
      'You must provide accurate and complete information. Registrations are subject to administrative verification.',
      'You are responsible for keeping your login credentials secure and reporting any unauthorized use.',
    ],
  },
  {
    id: 'payment',
    title: '2. Payment Terms and Gateway Regulations',
    body: [
      'Membership fees must be paid before access is activated.',
      'We use secure third-party payment options (Telebirr, M-Pesa, CBE Birr, and cards).',
      'All fees are processed in ETB, inclusive of taxes unless stated otherwise.',
    ],
  },
  {
    id: 'refund',
    title: '3. Strict No-Refund and No-Cancellation Policy',
    body: [
      'All payments are final and non-refundable under any circumstances.',
      'Membership is time-based and not based on attendance.',
      'No refunds or pauses are provided for illness, emergencies, or non-usage.',
    ],
  },
  {
    id: 'conduct',
    title: '4. Code of Conduct and Facility Regulations',
    body: [
      'Respect staff and members at all times; harassment or abuse results in immediate expulsion.',
      'Proper athletic attire and closed-toe shoes are required.',
      'Clean equipment after use and return weights to racks.',
      'Smoking, alcohol, and illegal substances are prohibited.',
    ],
  },
  {
    id: 'safety',
    title: '5. Health, Safety, and Assumption of Risk',
    body: [
      'You confirm you are fit to exercise and understand the risks involved.',
      'Participation involves inherent risk of injury or death, which you accept voluntarily.',
    ],
  },
  {
    id: 'liability',
    title: '6. Limitation of Liability',
    body: [
      'DBU Gym and its staff are not liable for direct or indirect damages arising from gym or website use.',
    ],
  },
  {
    id: 'termination',
    title: '7. Termination of Membership by Administration',
    body: [
      'DBU Gym may suspend or terminate membership without notice for violations of these Terms.',
    ],
  },
  {
    id: 'changes',
    title: '8. Changes to Terms and Conditions',
    body: [
      'These Terms may be updated at any time. Continued use indicates acceptance of changes.',
    ],
  },
]

export default function Terms() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-strong)]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-[var(--text)]">
            <span className="text-[var(--accent)]">DBU</span>GYM
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="text-[var(--text-muted)] hover:text-[var(--accent)]">
              Home
            </Link>
            <Link to="/login" className="rounded-full border border-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-black">
              Login / Register
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,177,53,0.2),_transparent_60%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-16 text-center md:px-8">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-soft)]">DBU Gym Policy Center</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Terms and <span className="text-[var(--accent)]">Conditions</span>
          </h1>
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">
            Please read these terms carefully before registering or purchasing a membership.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <span className="inline-flex rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                Last Updated: March 2026
              </span>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                These terms apply to the website, membership portal, and DBU Gym facilities.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">On This Page</h2>
              <nav className="mt-3 flex flex-col gap-2 text-sm">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-8">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <h2 className="text-xl font-semibold text-[var(--text)]">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm text-[var(--text-muted)]">
                  {section.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
              By registering for a DBU Gym account, you acknowledge that you have read and agree to these Terms and Conditions.
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
