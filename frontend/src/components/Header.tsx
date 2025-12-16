export const Header = () => {
  return (
    <header className="relative overflow-hidden border-b border-[var(--color-border)]">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-secondary)] via-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Icon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center shadow-lg glow-green">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-accent-primary)] rounded-full animate-pulse-glow" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="gradient-text">Multibagger</span>
                <span className="text-[var(--color-text-primary)] ml-2">Research</span>
              </h1>
              <p className="text-[var(--color-text-muted)] text-sm font-medium mt-0.5">
                Yartseva Quality Factor Model
              </p>
            </div>
          </div>
          
          {/* Right side badges */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] animate-pulse" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Live Data</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)]">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Russell 2000 Universe
              </span>
            </div>
          </div>
        </div>
        
        {/* Subtitle */}
        <p className="mt-4 text-[var(--color-text-secondary)] text-sm max-w-2xl">
          Institutional-grade stock screening powered by empirical research on 464 multibagger stocks achieving 10x+ returns (2009-2024)
        </p>
      </div>
    </header>
  );
};
