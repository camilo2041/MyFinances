import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { C } from '@/lib/theme';

export type IconName =
  | 'home'
  | 'list'
  | 'calendar'
  | 'target'
  | 'plus'
  | 'minus'
  | 'arrowUp'
  | 'arrowDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'close'
  | 'check'
  | 'bell'
  | 'settings'
  | 'backspace'
  | 'logout'
  | 'pause'
  | 'alert'
  | 'trash'
  | 'fingerprint'
  | 'face'
  | 'briefcase'
  | 'receipt'
  | 'bolt'
  | 'cart'
  | 'bus'
  | 'heart'
  | 'book'
  | 'food'
  | 'tv'
  | 'bank'
  | 'piggy'
  | 'dots'
  | 'gift'
  | 'sparkle'
  | 'bag'
  | 'cash'
  | 'tag'
  | 'eye'
  | 'eyeOff'
  | 'mic'
  | 'stop';

// Trazos a 1.8px, esquinas redondeadas: un solo lenguaje para toda la app.
export function Icon({ name, size = 22, color = C.text, strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...p} d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />}
      {name === 'list' && (
        <>
          <Path {...p} d="M9 7h11M9 12h11M9 17h11" />
          <Circle cx={4.5} cy={7} r={1.2} fill={color} />
          <Circle cx={4.5} cy={12} r={1.2} fill={color} />
          <Circle cx={4.5} cy={17} r={1.2} fill={color} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect {...p} x={4} y={5.5} width={16} height={14.5} rx={3} />
          <Path {...p} d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
          <Circle cx={12} cy={15} r={1.6} fill={color} />
        </>
      )}
      {name === 'target' && (
        <>
          <Circle {...p} cx={12} cy={12} r={8} />
          <Circle {...p} cx={12} cy={12} r={4.2} />
          <Circle cx={12} cy={12} r={1.3} fill={color} />
        </>
      )}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'minus' && <Path {...p} d="M5 12h14" />}
      {name === 'arrowUp' && <Path {...p} d="M12 19V5M6 11l6-6 6 6" />}
      {name === 'arrowDown' && <Path {...p} d="M12 5v14M6 13l6 6 6-6" />}
      {name === 'chevronLeft' && <Path {...p} d="m15 5-7 7 7 7" />}
      {name === 'chevronRight' && <Path {...p} d="m9 5 7 7-7 7" />}
      {name === 'close' && <Path {...p} d="M6 6l12 12M18 6 6 18" />}
      {name === 'check' && <Path {...p} d="m5 12.5 4.5 4.5L19 7.5" />}
      {name === 'bell' && <Path {...p} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />}
      {name === 'settings' && (
        <>
          <Path {...p} d="M4 7h9M17 7h3M4 17h3M11 17h9" />
          <Circle {...p} cx={15} cy={7} r={2} />
          <Circle {...p} cx={9} cy={17} r={2} />
        </>
      )}
      {name === 'backspace' && (
        <>
          <Path {...p} d="M9 5h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H9l-6-7z" />
          <Path {...p} d="m12 9.5 5 5M17 9.5l-5 5" />
        </>
      )}
      {name === 'logout' && <Path {...p} d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9" />}
      {name === 'pause' && <Path {...p} d="M9 6v12M15 6v12" />}
      {name === 'alert' && (
        <>
          <Path {...p} d="M12 4 21 19H3z" />
          <Path {...p} d="M12 10v4" />
          <Circle cx={12} cy={16.5} r={1} fill={color} />
        </>
      )}
      {name === 'fingerprint' && (
        <Path
          {...p}
          d="M12 11v3.5a6 6 0 0 1-1.2 3.6M8.5 20a9 9 0 0 0 1.5-5.5V11a2 2 0 0 1 4 0v1.5M15.8 17.5c.3-1 .4-2 .4-3V11a4.2 4.2 0 0 0-8.4 0v3.5c0 1-.2 2-.7 2.8M5.2 15.2c.2-.6.3-1.2.3-1.9V11a6.5 6.5 0 0 1 12.2-3.1M18.5 11.5v2.3"
        />
      )}
      {name === 'face' && (
        <>
          <Path {...p} d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
          <Path {...p} d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 15.5a3.5 3.5 0 0 0 5 0" />
        </>
      )}
      {name === 'briefcase' && (
        <>
          <Rect {...p} x={3.5} y={7.5} width={17} height={12} rx={2.5} />
          <Path {...p} d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" />
        </>
      )}
      {name === 'receipt' && <Path {...p} d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3zM9 8h6M9 11.5h6M9 15h3.5" />}
      {name === 'bolt' && <Path {...p} d="M13 3 5.5 13.5H12l-1 7.5 7.5-10.5H12z" />}
      {name === 'cart' && (
        <>
          <Path {...p} d="M3 4.5h2.2l2.2 10.5h10.2l2-7.5H6.2" />
          <Circle cx={9.5} cy={19} r={1.4} fill={color} />
          <Circle cx={16.5} cy={19} r={1.4} fill={color} />
        </>
      )}
      {name === 'bus' && (
        <>
          <Rect {...p} x={5} y={3.5} width={14} height={15} rx={3} />
          <Path {...p} d="M5 11h14M8 18.5v2M16 18.5v2" />
          <Circle cx={8.5} cy={14.8} r={1} fill={color} />
          <Circle cx={15.5} cy={14.8} r={1} fill={color} />
        </>
      )}
      {name === 'heart' && <Path {...p} d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10zM9.5 11.5h1.5l1-2 1.5 4 1-2h1.5" />}
      {name === 'book' && <Path {...p} d="M4.5 5.5A1.5 1.5 0 0 1 6 4h5.5v15.5H6a1.5 1.5 0 0 0-1.5 1.5zM19.5 5.5A1.5 1.5 0 0 0 18 4h-5.5v15.5H18a1.5 1.5 0 0 1 1.5 1.5z" />}
      {name === 'food' && <Path {...p} d="M7 3.5v17M4.5 3.5v4.5A2.5 2.5 0 0 0 7 10.5 2.5 2.5 0 0 0 9.5 8V3.5M17 20.5V3.5c-2 1-3.5 3.5-3.5 7h3.5" />}
      {name === 'tv' && (
        <>
          <Rect {...p} x={3.5} y={6} width={17} height={11.5} rx={2.5} />
          <Path {...p} d="M8.5 20.5h7M9 3l3 3 3-3" />
        </>
      )}
      {name === 'bank' && <Path {...p} d="M3.5 9.5 12 4.5l8.5 5zM5.5 10v7.5M9.8 10v7.5M14.2 10v7.5M18.5 10v7.5M3.5 20h17" />}
      {name === 'piggy' && (
        <>
          <Path {...p} d="M5 11.5a6.5 5.5 0 0 1 12.2-2.6l2.3-.9v4l-1.4.8A6.5 5.5 0 0 1 15.5 16v3h-2.5v-2h-3v2H7.5v-3.2A5.4 5.4 0 0 1 5 11.5zM3 10.5a2 2 0 0 0 2 1.5M11 7.5h3" />
          <Circle cx={15.2} cy={10.8} r={0.9} fill={color} />
        </>
      )}
      {name === 'dots' && (
        <>
          <Circle cx={6} cy={12} r={1.6} fill={color} />
          <Circle cx={12} cy={12} r={1.6} fill={color} />
          <Circle cx={18} cy={12} r={1.6} fill={color} />
        </>
      )}
      {name === 'gift' && (
        <>
          <Rect {...p} x={4} y={9} width={16} height={11.5} rx={2} />
          <Path {...p} d="M3.5 9h17M12 9v11.5M12 9C10.5 5 7 5.5 7.5 7.5S12 9 12 9zM12 9c1.5-4 5-3.5 4.5-1.5S12 9 12 9z" />
        </>
      )}
      {name === 'sparkle' && <Path {...p} d="M11 4c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6zM18 14.5c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8z" />}
      {name === 'bag' && <Path {...p} d="M5.5 8h13l-1 12.5h-11zM9 10.5V7a3 3 0 0 1 6 0v3.5" />}
      {name === 'cash' && (
        <>
          <Rect {...p} x={3} y={6.5} width={18} height={11} rx={2} />
          <Circle {...p} cx={12} cy={12} r={2.6} />
          <Path {...p} d="M6.5 9.5v5M17.5 9.5v5" />
        </>
      )}
      {name === 'tag' && (
        <>
          <Path {...p} d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z" />
          <Circle cx={8} cy={8} r={1.4} fill={color} />
        </>
      )}
      {name === 'eye' && (
        <>
          <Path {...p} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <Circle {...p} cx={12} cy={12} r={3} />
        </>
      )}
      {name === 'eyeOff' && <Path {...p} d="M4 4l16 16M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 7.4A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1M10 10a3 3 0 0 0 4 4" />}
      {name === 'mic' && (
        <>
          <Rect {...p} x={9} y={3} width={6} height={11.5} rx={3} />
          <Path {...p} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </>
      )}
      {name === 'stop' && <Rect x={7} y={7} width={10} height={10} rx={2.5} fill={color} />}
      {name === 'trash' && <Path {...p} d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />}
    </Svg>
  );
}
