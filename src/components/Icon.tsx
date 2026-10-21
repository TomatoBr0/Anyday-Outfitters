/**
 * Getup line icon set. 24×24 grid, 1.75 stroke, round caps — drawn to match
 * the logo's hanger geometry. Hand-built so the app ships no icon font.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

export type IconName =
  | 'today' | 'hanger' | 'plus' | 'calendar' | 'user' | 'search' | 'filter' | 'grid' | 'list'
  | 'heart' | 'heartFill' | 'check' | 'x' | 'chevronLeft' | 'chevronRight' | 'chevronDown'
  | 'refresh' | 'lock' | 'unlock' | 'swap' | 'camera' | 'image' | 'trash' | 'edit' | 'basket'
  | 'shirt' | 'sun' | 'cloud' | 'rain' | 'snow' | 'wind' | 'fog' | 'storm' | 'pin' | 'suitcase'
  | 'thumbUp' | 'thumbDown' | 'bookmark' | 'bookmarkFill' | 'more' | 'settings' | 'info'
  | 'rotate' | 'crop' | 'clock' | 'arrowRight' | 'sliders' | 'moon' | 'drop' | 'history' | 'star' | 'sparkles';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color, strokeWidth = 1.75 }: Props) {
  const { colors } = useTheme();
  const c = color ?? colors.text;
  const p = { stroke: c, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const f = { fill: c };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {render(name, p, f)}
    </Svg>
  );
}

function render(name: IconName, p: any, f: any) {
  switch (name) {
    case 'today':
      return (
        <>
          <Path {...p} d="M3 17h18" />
          <Path {...p} d="M7 17a5 5 0 0 1 10 0" />
          <Path {...p} d="M12 6.5V8M5.6 9.6l1 1M18.4 9.6l-1 1M3.5 13.5H5M19 13.5h1.5" />
          <Path {...p} d="M8 20.5h8" />
        </>
      );
    case 'hanger':
      return (
        <>
          <Path {...p} d="M12 8.2V7.6c0-.7.5-1.1 1.1-1.5A2.1 2.1 0 1 0 9.9 4.3" />
          <Path {...p} d="M12 8.2 3.4 15.4c-.8.7-.3 2 .8 2h15.6c1.1 0 1.6-1.3.8-2L12 8.2Z" />
        </>
      );
    case 'plus':
      return <Path {...p} d="M12 5v14M5 12h14" />;
    case 'calendar':
      return (
        <>
          <Rect {...p} x={3.5} y={5} width={17} height={15.5} rx={3} />
          <Path {...p} d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...p} cx={12} cy={8.5} r={3.8} />
          <Path {...p} d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle {...p} cx={11} cy={11} r={6.5} />
          <Path {...p} d="m16 16 4.5 4.5" />
        </>
      );
    case 'filter':
    case 'sliders':
      return <Path {...p} d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4" />;
    case 'grid':
      return (
        <>
          <Rect {...p} x={4} y={4} width={7} height={7} rx={1.6} />
          <Rect {...p} x={13} y={4} width={7} height={7} rx={1.6} />
          <Rect {...p} x={4} y={13} width={7} height={7} rx={1.6} />
          <Rect {...p} x={13} y={13} width={7} height={7} rx={1.6} />
        </>
      );
    case 'list':
      return <Path {...p} d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />;
    case 'heart':
      return <Path {...p} d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" />;
    case 'heartFill':
      return <Path {...p} {...f} d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" />;
    case 'check':
      return <Path {...p} d="m5 12.5 4.5 4.5L19 7.5" />;
    case 'x':
      return <Path {...p} d="M6 6l12 12M18 6 6 18" />;
    case 'chevronLeft':
      return <Path {...p} d="M15 5.5 8.5 12l6.5 6.5" />;
    case 'chevronRight':
      return <Path {...p} d="M9 5.5 15.5 12 9 18.5" />;
    case 'chevronDown':
      return <Path {...p} d="M5.5 9 12 15.5 18.5 9" />;
    case 'refresh':
      return (
        <>
          <Path {...p} d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
          <Path {...p} d="M19.5 4.5v4h-4" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect {...p} x={5} y={10.5} width={14} height={10} rx={2.5} />
          <Path {...p} d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </>
      );
    case 'unlock':
      return (
        <>
          <Rect {...p} x={5} y={10.5} width={14} height={10} rx={2.5} />
          <Path {...p} d="M8 10.5V8a4 4 0 0 1 7.7-1.5" />
        </>
      );
    case 'swap':
      return <Path {...p} d="M7 4.5 3.5 8 7 11.5M3.5 8h13M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-13" />;
    case 'camera':
      return (
        <>
          <Path {...p} d="M4 8.5A2 2 0 0 1 6 6.5h1.8l1.4-2h5.6l1.4 2H18a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" />
          <Circle {...p} cx={12} cy={13} r={3.6} />
        </>
      );
    case 'image':
      return (
        <>
          <Rect {...p} x={3.5} y={4.5} width={17} height={15} rx={3} />
          <Circle {...p} cx={9} cy={10} r={1.6} />
          <Path {...p} d="m4 17.5 4.8-4.3 3.4 3 2.8-2.5 5 4.3" />
        </>
      );
    case 'trash':
      return <Path {...p} d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12M10 11v6M14 11v6" />;
    case 'edit':
      return <Path {...p} d="M4.5 19.5h4l10-10a2.8 2.8 0 0 0-4-4l-10 10v4ZM13.5 6.5l4 4" />;
    case 'basket':
      return (
        <>
          <Path {...p} d="M4 9.5h16l-1.6 9a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6L4 9.5Z" />
          <Path {...p} d="M8.5 9.5 11 4M15.5 9.5 13 4M9.5 13v3.5M14.5 13v3.5" />
        </>
      );
    case 'shirt':
      return <Path {...p} d="M9 4 4 6.5l1.8 4.2L8 10v10h8V10l2.2.7L20 6.5 15 4a3 3 0 0 1-6 0Z" />;
    case 'sun':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={4} />
          <Path {...p} d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
        </>
      );
    case 'cloud':
      return <Path {...p} d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.2 18.5H7Z" />;
    case 'rain':
      return (
        <>
          <Path {...p} d="M7 14.5a4.2 4.2 0 0 1-.6-8.4 5.6 5.6 0 0 1 10.7 1.5A3.5 3.5 0 0 1 16.8 14.5" />
          <Path {...p} d="M8.5 17.5 7.5 20M12.5 16.5l-1.2 3.5M16.5 17.5l-1 2.5" />
        </>
      );
    case 'snow':
      return (
        <>
          <Path {...p} d="M7 13.5a4.2 4.2 0 0 1-.6-8.4 5.6 5.6 0 0 1 10.7 1.5A3.5 3.5 0 0 1 16.8 13.5" />
          <Path {...p} d="M8 17h.01M12 16h.01M16 17h.01M10 20h.01M14 20h.01" strokeWidth={2.6} />
        </>
      );
    case 'wind':
      return <Path {...p} d="M3.5 9h11a2.5 2.5 0 1 0-2.5-2.5M3.5 13h15a2.5 2.5 0 1 1-2.5 2.5M3.5 17h7" />;
    case 'fog':
      return <Path {...p} d="M4 9h16M6 13h12M4 17h16" />;
    case 'storm':
      return (
        <>
          <Path {...p} d="M7 14a4.2 4.2 0 0 1-.6-8.4 5.6 5.6 0 0 1 10.7 1.5A3.5 3.5 0 0 1 16.8 14" />
          <Path {...p} d="m12.5 13-2.5 4h4l-2.5 4" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path {...p} d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
          <Circle {...p} cx={12} cy={10} r={2.3} />
        </>
      );
    case 'suitcase':
      return (
        <>
          <Rect {...p} x={4} y={7.5} width={16} height={12} rx={2.5} />
          <Path {...p} d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M8.5 7.5v12M15.5 7.5v12" />
        </>
      );
    case 'thumbUp':
      return <Path {...p} d="M7.5 10.5v9H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h2.5Zm0 0L11 4a2 2 0 0 1 2.5 2.2L13 9.5h5.3a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H7.5" />;
    case 'thumbDown':
      return <Path {...p} d="M7.5 13.5v-9H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2.5Zm0 0L11 20a2 2 0 0 0 2.5-2.2l-.5-3.3h5.3a2 2 0 0 0 2-2.4l-1.3-6a2 2 0 0 0-2-1.6H7.5" />;
    case 'bookmark':
      return <Path {...p} d="M6.5 4.5h11v15.5L12 16l-5.5 4V4.5Z" />;
    case 'bookmarkFill':
      return <Path {...p} {...f} d="M6.5 4.5h11v15.5L12 16l-5.5 4V4.5Z" />;
    case 'more':
      return <Path {...p} d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth={3} />;
    case 'settings':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={3} />
          <Path {...p} d="M19 13.4v-2.8l-2-.6-.6-1.4 1-1.9-2-2-1.9 1-1.4-.6-.6-2h-2.8l-.6 2-1.4.6-1.9-1-2 2 1 1.9-.6 1.4-2 .6v2.8l2 .6.6 1.4-1 1.9 2 2 1.9-1 1.4.6.6 2h2.8l.6-2 1.4-.6 1.9 1 2-2-1-1.9.6-1.4 2-.6Z" />
        </>
      );
    case 'info':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8.5} />
          <Path {...p} d="M12 11v5.5M12 7.8h.01" />
        </>
      );
    case 'rotate':
      return (
        <>
          <Path {...p} d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
          <Path {...p} d="M4.5 4.5v4h4" />
        </>
      );
    case 'crop':
      return <Path {...p} d="M7 3v14h14M3 7h14v14" />;
    case 'clock':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8.5} />
          <Path {...p} d="M12 7.5V12l3 2" />
        </>
      );
    case 'arrowRight':
      return <Path {...p} d="M4.5 12h15M13.5 6l6 6-6 6" />;
    case 'moon':
      return <Path {...p} d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />;
    case 'drop':
      return <Path {...p} d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" />;
    case 'history':
      return (
        <>
          <Path {...p} d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" />
          <Path {...p} d="M4 4v4.5h4.5M12 8v4.3l3 1.7" />
        </>
      );
    case 'star':
      return <Path {...p} d="m12 4 2.4 5 5.3.7-3.9 3.7 1 5.3L12 16.2l-4.8 2.5 1-5.3-3.9-3.7 5.3-.7L12 4Z" />;
    case 'sparkles':
      return <Path {...p} d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" />;
  }
}
