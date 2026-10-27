import React from 'react';

export type GardenStampType = 
  | 'tree'
  | 'flower'
  | 'mushroom'
  | 'leaf'
  | 'boat'
  | 'cloud'
  | 'spiderweb'
  | 'ladybug'
  | 'tulip'
  | 'berry'
  | 'coffee'
  | 'bird'
  | 'sprout';

interface GardenIconProps {
  name: string;
  className?: string;
  color?: string; // defaults to cobalt '#2E1FD0'
  strokeWidth?: number;
}

export const GardenIcon: React.FC<GardenIconProps> = ({
  name,
  className = 'w-6 h-6',
  color = 'currentColor',
  strokeWidth = 1.6,
}) => {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'tree':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Hand-drawn branched botanical tree as in screenshot 1 */}
          <path d="M16 28V16M16 20C13 18 10 14 10 11C10 7.5 13 6 16 6C19 6 22 7.5 22 11C22 14 19 18 16 20Z" />
          <path d="M16 16L12 12" />
          <path d="M16 14L20 11" />
          <path d="M16 19L19 16" />
          <path d="M12 28H20" />
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Botanical flower with petals */}
          <circle cx="16" cy="13" r="2.5" />
          <path d="M16 10.5C16 8 18 8 18 10.5C18 13 16 13 16 13Z" />
          <path d="M16 15.5C16 18 14 18 14 15.5C14 13 16 13 16 13Z" />
          <path d="M18.5 13C21 13 21 15 18.5 15C16 15 16 13 16 13Z" />
          <path d="M13.5 13C11 13 11 11 13.5 11C16 11 16 13 16 13Z" />
          <path d="M16 16V27" />
          <path d="M16 21C18 19 21 20 20 22C19 23 17 22 16 21Z" />
          <path d="M16 24C14 23 12 23 12 25C13 26 15 25 16 24Z" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Cute toadstool mushroom */}
          <path d="M8 18C8 11.5 11.5 7 16 7C20.5 7 24 11.5 24 18H8Z" />
          <path d="M13 18V26C13 27 15 27.5 16 27.5C17 27.5 19 27 19 26V18" />
          <circle cx="12" cy="13" r="1.2" fill={color} />
          <circle cx="16" cy="10" r="1.2" fill={color} />
          <circle cx="20" cy="14" r="1.2" fill={color} />
          <path d="M10 27H22" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Delicate leaf branch */}
          <path d="M11 27C14 21 17 14 23 8" />
          <path d="M16 21C14 19 13 20 14 22" />
          <path d="M17 18C20 17 20 19 18 20" />
          <path d="M19 14C17 12 16 13 17 15" />
          <path d="M20 11C23 10 23 12 21 13" />
        </svg>
      );
    case 'boat':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Whimsical line sailboat as in screenshot 1 */}
          <path d="M16 6V21" />
          <path d="M16 8L23 18H16" />
          <path d="M8 21H24L21 26H11L8 21Z" />
          <path d="M6 28C9 27 12 29 15 28C18 27 21 29 24 28" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Puffy doodle cloud */}
          <path d="M9 21C6.8 21 5 19.2 5 17C5 15.1 6.3 13.5 8.2 13.1C8.7 9.7 11.6 7 15 7C18.6 7 21.6 9.8 21.9 13.4C23.7 13.8 25 15.3 25 17.2C25 19.3 23.3 21 21.2 21H9Z" />
        </svg>
      );
    case 'spiderweb':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Delicate corner spiderweb */}
          <path d="M7 7L25 25" />
          <path d="M7 7H25" />
          <path d="M7 7V25" />
          <path d="M7 16L16 7" />
          <path d="M7 21L21 7" />
          <path d="M12 12C14 11 16 11 18 13C19 14 19 16 18 18" />
          <path d="M16 16C19 15 22 15 24 18" />
        </svg>
      );
    case 'ladybug':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Cute ladybug with dots */}
          <circle cx="16" cy="18" r="7" />
          <path d="M16 11V25" />
          <path d="M13 11C13 9 14 8 16 8C18 8 19 9 19 11" />
          <path d="M14 8L12 6" />
          <path d="M18 8L20 6" />
          <circle cx="13" cy="16" r="1" fill={color} />
          <circle cx="19" cy="16" r="1" fill={color} />
          <circle cx="14" cy="21" r="1" fill={color} />
          <circle cx="18" cy="21" r="1" fill={color} />
        </svg>
      );
    case 'tulip':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          <path d="M11 15C11 19 14 21 16 21C18 21 21 19 21 15C21 11 19 9 16 12C13 9 11 11 11 15Z" />
          <path d="M16 12V21" />
          <path d="M16 21V28" />
          <path d="M16 24C19 23 21 24 21 26C19 27 17 26 16 24Z" />
        </svg>
      );
    case 'berry':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          <path d="M16 9C12 9 10 13 10 17C10 22 16 27 16 27C16 27 22 22 22 17C22 13 20 9 16 9Z" />
          <path d="M14 6L16 9L18 6" />
          <path d="M16 6V4" />
          <circle cx="13" cy="14" r="0.8" fill={color} />
          <circle cx="16" cy="15" r="0.8" fill={color} />
          <circle cx="19" cy="14" r="0.8" fill={color} />
          <circle cx="14" cy="19" r="0.8" fill={color} />
          <circle cx="18" cy="19" r="0.8" fill={color} />
        </svg>
      );
    case 'coffee':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Cozy takeaway cup with straw like matcha latte */}
          <path d="M11 12H21L19.5 26H12.5L11 12Z" />
          <path d="M9.5 12H22.5" />
          <path d="M12 9H20L19 12H13L12 9Z" />
          <path d="M16 4L18 9" />
          <circle cx="16" cy="19" r="2" />
        </svg>
      );
    case 'bird':
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Tiny walking chick/bird as seen in screenshot 2 */}
          <circle cx="18" cy="13" r="3" />
          <path d="M21 13L24 14L21 15" />
          <path d="M16 15C13 16 11 19 12 23C15 24 19 22 20 18" />
          <path d="M14 23L13 27M13 27L11 27M13 27L15 27" />
          <path d="M17 22L17 27M17 27L15 27M17 27L19 27" />
        </svg>
      );
    case 'sprout':
    default:
      return (
        <svg viewBox="0 0 32 32" className={className} {...common}>
          {/* Sprouting garden seedling */}
          <path d="M16 27V15" />
          <path d="M16 18C12 17 10 13 12 11C15 10 16 14 16 18Z" />
          <path d="M16 15C20 14 22 10 20 8C17 7 16 11 16 15Z" />
          <path d="M11 27H21" />
        </svg>
      );
  }
};

export const ALL_GARDEN_STAMPS: { id: GardenStampType; label: string }[] = [
  { id: 'tree', label: '나무 (Tree)' },
  { id: 'flower', label: '꽃 (Flower)' },
  { id: 'tulip', label: '튤립 (Tulip)' },
  { id: 'mushroom', label: '버섯 (Mushroom)' },
  { id: 'berry', label: '열매 (Berry)' },
  { id: 'ladybug', label: '무당벌레 (Ladybug)' },
  { id: 'boat', label: '돛단배 (Boat)' },
  { id: 'cloud', label: '구름 (Cloud)' },
  { id: 'spiderweb', label: '거미줄 (Web)' },
  { id: 'leaf', label: '나뭇잎 (Leaf)' },
  { id: 'coffee', label: '말차/커피 (Matcha)' },
  { id: 'bird', label: '새 (Bird)' },
  { id: 'sprout', label: '새싹 (Sprout)' },
];
