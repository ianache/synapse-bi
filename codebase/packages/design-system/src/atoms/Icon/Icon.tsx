import type { SVGProps } from 'react'
const paths = {
 key:'M15 7a2 2 0 0 1 2 2 M21 9a6 6 0 0 1-7.74 5.74L11 17H9v2H7v2H3v-4l6-6A6 6 0 1 1 21 9z',
 lock:'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2',
 server:'M3 3h18v7H3z M3 14h18v7H3z M17 6.5h.01 M17 17.5h.01',
 database:'M4 6v12c0 4 16 4 16 0V6 M20 6c0 4-16 4-16 0s16-4 16 0 M4 12c0 4 16 4 16 0',
 monitor:'M3 3h18v14H3z M8 21h8 M12 17v4',
 search:'m21 21-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 check:'m5 12 4 4L19 6', arrow:'M5 12h14m-6-6 6 6-6 6', bookmark:'M6 3h12v18l-6-4-6 4z',
 user:'M20 21a8 8 0 0 0-16 0 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M20 21v-2a4 4 0 0 0-3-3.87 M16 3a4 4 0 0 1 0 8',
 building:'M5 21V3h14v18 M3 21h18 M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1',
 clock:'M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 receipt:'M5 3l2 1 2-1 3 1 3-1 2 1 2-1v18l-2-1-2 1-3-1-3 1-2-1-2 1z M8 8h8m-8 4h8m-8 4h5',
 box:'m3 7 9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 download:'M12 3v12m-5-5 5 5 5-5 M4 16v5h16v-5',filter:'M4 6h16M7 12h10m-7 6h4',
 home:'m3 10 9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8', chart:'M4 20V4m0 16h17 M8 16v-5m5 5V7m5 9v-8',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
 message:'M21 15a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z',
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 chevron:'m9 5 7 7-7 7', plus:'M12 4v16M4 12h16',up:'m6 12 6-6 6 6 M12 6v13', more:'M12 4h.01M12 12h.01M12 20h.01',
 layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5M2 16l10 5 10-5'
} as const
export type IconName = keyof typeof paths
export function Icon({name,size=16,...props}:SVGProps<SVGSVGElement>&{name:IconName;size?:number}) {
 return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
