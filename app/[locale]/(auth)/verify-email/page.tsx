import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
        <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white">Check your email</h1>
        <p className="text-gray-400 text-sm">
          We sent a confirmation link to your email address.<br />
          You can close this page and continue using the app.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface px-5 py-4 text-left space-y-2">
        <p className="text-white text-xs font-semibold">Next steps</p>
        <ol className="space-y-1.5 text-gray-500 text-xs list-none">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{'1'}</span>
            <span>Open the email from DCORE</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{'2'}</span>
            <span>Click the confirmation link</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{'3'}</span>
            <span>Your email is now verified — password reset will work</span>
          </li>
        </ol>
      </div>

      <p className="text-gray-600 text-xs">Didn't receive it? Check your spam folder.</p>

      <Link
        href="/login"
        className="inline-block px-5 py-2 rounded-xl border border-border text-gray-400 text-sm hover:text-white hover:border-gray-500 transition-colors"
      >
        Back to sign in
      </Link>
    </div>
  )
}
