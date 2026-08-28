type Props = {
  tamano?: number;
  className?: string;
};

export const IsotipoMono = ({ tamano = 26, className }: Props) => (
  <svg
    width={tamano}
    height={tamano}
    viewBox="0 0 128 128"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="64" cy="64" r="55" fill="none" stroke="currentColor" strokeWidth={7} opacity={0.55} />
    <g fill="currentColor">
      <path d="M64 26c6 9 8 19 8 29s-2 18-8 26c-6-8-8-16-8-26s2-20 8-29z" />
      <path d="M62 58c-8-4-15-11-19-20 10 1 18 5 24 12z" />
      <path d="M66 58c8-4 15-11 19-20-10 1-18 5-24 12z" />
      <path d="M61 74c-10-2-19-7-25-15 10-2 20 0 28 7z" />
      <path d="M67 74c10-2 19-7 25-15-10-2-20 0-28 7z" />
      <path d="M62 84c-8 1-16-1-23-6 8-4 17-4 25 0z" />
      <path d="M66 84c8 1 16-1 23-6-8-4-17-4-25 0z" />
    </g>
    <rect x="62.5" y="66" width="3" height="26" rx="1.5" fill="currentColor" opacity={0.7} />
  </svg>
);
