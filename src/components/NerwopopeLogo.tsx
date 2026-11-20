import React from 'react';

interface LogoProps {
  className?: string;
}

export const NerwopopeLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#163828" />
      <path
        d="M30 14C20.0589 14 12 22.0589 12 32C12 41.9411 20.0589 50 30 50V14Z"
        fill="#FAF6EE"
      />
      <path
        d="M34 14C43.9411 14 52 22.0589 52 32C52 41.9411 43.9411 50 34 50V14Z"
        fill="#F2B705"
      />
      <circle cx="32" cy="32" r="4.5" fill="#163828" />
    </svg>
  );
};

export const JoiningHalvesIllustration: React.FC = () => {
  return (
    <div
      className="relative w-full max-w-[440px] mx-auto select-none"
      aria-label="Diagram illustrating one for one matching where a donor gift half and sponsor pool half join into a full gift for the beneficiary"
    >
      <svg
        viewBox="0 0 440 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <rect
          x="12"
          y="12"
          width="416"
          height="316"
          rx="28"
          fill="#1E4633"
          stroke="#2D6A4F"
          strokeWidth="1.5"
        />

        {/* Subtle botanical grid rings */}
        <circle
          cx="220"
          cy="160"
          r="116"
          stroke="#2D6A4F"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <circle cx="220" cy="160" r="88" stroke="#FAF6EE" strokeOpacity="0.18" strokeWidth="1" />

        {/* Left Half: Donor Gift */}
        <path
          d="M214 76C167.608 76 130 113.608 130 160C130 206.392 167.608 244 214 244V76Z"
          fill="#FAF6EE"
        />
        {/* Right Half: Sponsor Match */}
        <path
          d="M226 76C272.392 76 310 113.608 310 160C310 206.392 272.392 244 226 244V76Z"
          fill="#F2B705"
        />

        {/* Center Seam Lock */}
        <circle cx="220" cy="160" r="14" fill="#163828" stroke="#FAF6EE" strokeWidth="2.5" />
        <circle cx="220" cy="160" r="5" fill="#F2B705" />

        {/* Clean non-numeric labels */}
        <text
          x="104"
          y="286"
          textAnchor="middle"
          fill="#FAF6EE"
          fontSize="13"
          fontWeight="600"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          Donor gift
        </text>
        <text
          x="220"
          y="286"
          textAnchor="middle"
          fill="#FAF6EE"
          fillOpacity="0.7"
          fontSize="13"
          fontWeight="600"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          +
        </text>
        <text
          x="336"
          y="286"
          textAnchor="middle"
          fill="#F2B705"
          fontSize="13"
          fontWeight="600"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          Sponsor match
        </text>

        <text
          x="220"
          y="46"
          textAnchor="middle"
          fill="#FAF6EE"
          fontSize="12"
          fontWeight="500"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        >
          Joining halves to beneficiary
        </text>
      </svg>
    </div>
  );
};
