import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  // Made bigger: sm = 34px, md = 42px, lg = 50px
  const iconSize = size === 'sm' ? 34 : size === 'lg' ? 50 : 42;

  return (
    <div id="brand-logo" className="flex items-center gap-3 select-none">
      <div 
        className="relative flex items-center justify-center rounded-xl bg-[#2D3536] text-white shadow-sm transition-transform hover:scale-105 duration-200"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* Abstract geometric mark: Two interlocking document/candidate convergence nodes linked by an intelligent focus ring */}
        <svg
          width={iconSize * 0.65}
          height={iconSize * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base document outline */}
          <path
            d="M5 4C5 2.89543 5.89543 2 7 2H13L19 8V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V4Z"
            stroke="#B3C9D6"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
          />
          {/* Target alignment ring & convergence node */}
          <circle cx="12" cy="13" r="4.5" stroke="#F2EFE2" strokeWidth="1.75" />
          <circle cx="12" cy="13" r="1.75" fill="#98AA9D" />
          {/* Dynamic precision fit crosshair */}
          <path d="M12 6.5V7.5M12 18.5V19.5M5.5 13H6.5M17.5 13H18.5" stroke="#C2E9E5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-extrabold tracking-tight text-[#2D3536]">
            Shortlist
          </span>
          <span className="text-xl font-bold tracking-tight text-[#697C70]">
            Engine
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-[#64736E] font-normal tracking-normal -mt-0.5">
            Intelligent Candidate Matching
          </span>
        )}
      </div>
    </div>
  );
};
