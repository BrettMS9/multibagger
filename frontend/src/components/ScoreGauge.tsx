interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge = ({ score, maxScore, size = 'md' }: ScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getColor = () => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrokeColor = () => {
    if (percentage >= 75) return '#16a34a';
    if (percentage >= 50) return '#ca8a04';
    if (percentage >= 25) return '#ea580c';
    return '#dc2626';
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#e2e8f0"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${getColor()} ${textSizeClasses[size]}`}>
          {score.toFixed(1)}
        </span>
        <span className={`text-slate-500 ${textSizeClasses[size]}`}>
          / {maxScore}
        </span>
      </div>
    </div>
  );
};
