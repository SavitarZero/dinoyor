'use client'

export function slugColor(slug: string) {
  const palette = [
    ['#1a1a2e', '#e94560'],
    ['#0d0d1a', '#f5a623'],
    ['#0a1628', '#4fc3f7'],
    ['#0f1923', '#ff4655'],
    ['#1a0a00', '#ff6d00'],
    ['#0d1117', '#f0b400'],
    ['#1a001a', '#c084fc'],
    ['#001a1a', '#00e5ff'],
    ['#0a1a0a', '#69f0ae'],
    ['#1a0a0a', '#ef9a9a'],
    ['#000a1a', '#42a5f5'],
    ['#001a10', '#00e676'],
  ]
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash)
  const [bg, accent] = palette[Math.abs(hash) % palette.length]
  return { bg, accent }
}

interface LogoProps {
  src: string | null
  slug: string
  name: string
  className?: string
}

// Colored fallback is the base layer. Real image overlays on top and hides itself on 404.
export function GameLogo({ src, slug, name, className = 'w-8 h-8 rounded-lg' }: LogoProps) {
  const { bg, accent } = slugColor(slug)
  const initial = name[0]?.toUpperCase() ?? '?'

  return (
    <span
      className={`${className} relative flex items-center justify-center shrink-0 overflow-hidden`}
      style={{ background: bg }}
    >
      <span className="font-black text-[55%] leading-none select-none" style={{ color: accent }}>{initial}</span>
      {src && (
        <>
          <span className="absolute inset-0 bg-white/5 animate-pulse" data-skeleton />
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0) {
                el.style.opacity = '1'
                const skel = el.previousElementSibling as HTMLElement
                if (skel) skel.style.display = 'none'
              }
            }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1'
              const skel = e.currentTarget.previousElementSibling as HTMLElement
              if (skel) skel.style.display = 'none'
            }}
            onError={(e) => {
              e.currentTarget.style.opacity = '0'
              const skel = e.currentTarget.previousElementSibling as HTMLElement
              if (skel) skel.style.display = 'none'
            }}
          />
        </>
      )}
    </span>
  )
}

interface BannerProps {
  src: string | null
  slug: string
  name: string
  className?: string
  children?: React.ReactNode
}

// Colored gradient is always rendered as background. Image overlays on top and hides on 404.
export function GameBanner({ src, slug, name, className = 'w-full h-full', children }: BannerProps) {
  const { bg, accent } = slugColor(slug)

  return (
    <div
      className={`${className} relative flex items-center justify-center overflow-hidden`}
      style={{
        background: `radial-gradient(ellipse at 30% 50%, ${accent}22 0%, ${bg} 60%)`,
        backgroundColor: bg,
      }}
    >
      <span className="text-6xl font-black opacity-10 select-none pointer-events-none" style={{ color: accent }}>
        {name}
      </span>
      {src && (
        <>
          <div className="absolute inset-0 bg-white/5 animate-pulse" data-skeleton />
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0) {
                el.style.opacity = '1'
                const skel = el.previousElementSibling as HTMLElement
                if (skel) skel.style.display = 'none'
              }
            }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1'
              const skel = e.currentTarget.previousElementSibling as HTMLElement
              if (skel) skel.style.display = 'none'
            }}
            onError={(e) => {
              e.currentTarget.style.opacity = '0'
              const skel = e.currentTarget.previousElementSibling as HTMLElement
              if (skel) skel.style.display = 'none'
            }}
          />
        </>
      )}
      {children}
    </div>
  )
}
