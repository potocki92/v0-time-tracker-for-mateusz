import Link from 'next/link'

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-[1400px] px-5 py-28 text-center sm:px-8 sm:py-40">
      <h2 id="cta-heading" className="lv2-display lv2-d2 mx-auto max-w-[18ch]">
        Start the clock. The rest follows.
      </h2>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="lv2-cta">
          Open app
        </Link>
        <Link href="/auth/sign-up" className="lv2-cta-ghost">
          Create an account
        </Link>
      </div>
    </section>
  )
}
