import Link from 'next/link'
import { ShieldCheck, Zap, Users, BadgeCheck, Coins, Headphones, Globe } from 'lucide-react'

export default function InfoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          About DCORE
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
          The safest way to trade<br />
          <span className="text-accent">gaming items in SEA</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base">
          DCORE is a peer-to-peer marketplace for gaming items — built for Southeast Asian gamers with crypto escrow and zero trust required.
        </p>
      </div>

      {/* How it works */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { n: '01', title: 'Find an Item',       desc: 'Browse listings across your favourite SEA games. Filter by game, price, or currency.' },
            { n: '02', title: 'Pay with Crypto',    desc: 'Your funds are locked in escrow the moment you pay — neither buyer nor seller can touch them until delivery.' },
            { n: '03', title: 'Confirm & Release',  desc: 'Received the item? Confirm in one click and payment is released to the seller instantly.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="rounded-xl border border-border bg-surface p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-5xl font-black text-border/60 select-none">{n}</div>
              <p className="text-accent text-xs font-bold uppercase tracking-wider mb-2">Step {n}</p>
              <p className="text-white font-semibold">{title}</p>
              <p className="text-gray-500 text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why DCORE */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">Why DCORE</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { Icon: ShieldCheck, title: 'Crypto Escrow',     desc: 'Funds are held in escrow until both parties confirm. No chargebacks, no fraud.' },
            { Icon: Zap,         title: 'Auto-Release',      desc: 'If the seller does not respond in 24 h after marking delivered, funds release automatically.' },
            { Icon: BadgeCheck,  title: 'KYC Verified',      desc: 'Sellers must pass identity verification before listing — so you always know who you\'re trading with.' },
            { Icon: Coins,       title: 'Multi-Currency',    desc: 'Pay with USDT, ETH, or BTC. No FX fees, no banks involved.' },
            { Icon: Headphones,  title: 'Dispute Support',   desc: 'Raise a dispute any time before auto-release. Our team reviews evidence and resolves fairly.' },
            { Icon: Globe,       title: 'SEA Focused',       desc: 'Built for Thailand, Malaysia, Philippines, Indonesia, and Singapore gamers.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fees */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">Fees</h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              {[
                { action: 'Listing an item',       fee: 'Free' },
                { action: 'Platform fee (seller)', fee: '5% + 1 USDT per sale' },
                { action: 'Buyer fee',             fee: '0%' },
                { action: 'Withdrawal',            fee: 'Network gas only' },
              ].map(({ action, fee }) => (
                <tr key={action} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 text-gray-300">{action}</td>
                  <td className="px-5 py-3.5 text-right text-white font-semibold">{fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <p className="text-gray-400 text-sm mb-5">Ready to get started?</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/market" className="px-6 py-2.5 rounded-full bg-accent text-black font-bold text-sm hover:opacity-90 transition-opacity">
            Browse Market
          </Link>
          <Link href="/register" className="px-6 py-2.5 rounded-full border border-border text-white text-sm hover:border-gray-500 transition-colors">
            Create Account
          </Link>
        </div>
      </section>

    </div>
  )
}
