interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge = ({ score, maxScore, size = 'md', showLabel = true }: ScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;

  const sizeConfig = {
    sm: { container: 'w-20 h-20', text: 'text-lg', subtext: 'text-[10px]', strokeWidth: 6 },
    md: { container: 'w-28 h-28', text: 'text-2xl', subtext: 'text-xs', strokeWidth: 7 },
    lg: { container: 'w-36 h-36', text: 'text-3xl', subtext: 'text-sm', strokeWidth: 8 },
  };

  const config = sizeConfig[size];

  const getGradientId = () => {
    if (percentage >= 70) return 'gradient-strong';
    if (percentage >= 55) return 'gradient-moderate';
    if (percentage >= 40) return 'gradient-weak';
    return 'gradient-avoid';
  };

  const getGlowColor = () => {
    if (percentage >= 70) return 'rgba(16, 185, 129, 0.4)';
    if (percentage >= 55) return 'rgba(245, 158, 11, 0.4)';
    if (percentage >= 40) return 'rgba(251, 146, 60, 0.4)';
    return 'rgba(239, 68, 68, 0.4)';
  };

  const getTextColor = () => {
    if (percentage >= 70) return 'text-emerald-400';
    if (percentage >= 55) return 'text-amber-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${config.container}`}>
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        style={{ background: getGlowColor() }}
      />
      
      <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
        <defs>
          {/* Strong Buy Gradient */}
          <linearGradient id="gradient-strong" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          
          {/* Moderate Buy Gradient */}
          <linearGradient id="gradient-moderate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          
          {/* Weak Buy Gradient */}
          <linearGradient id="gradient-weak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          
          {/* Avoid Gradient */}
          <linearGradient id="gradient-avoid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="var(--color-bg-tertiary)"
          strokeWidth={config.strokeWidth}
          fill="none"
        />
        
        {/* Progress arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={`url(#${getGradientId()})`}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#glow)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className={`font-bold ${getTextColor()} ${config.text}`}>
          {score.toFixed(1)}
        </span>
        {showLabel && (
          <span className={`text-[var(--color-text-muted)] ${config.subtext} font-medium`}>
            / {maxScore}
          </span>
        )}
      </div>
    </div>
  );
};
