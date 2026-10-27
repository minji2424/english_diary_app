import React from 'react';

export type CatId =
  | 'momo'
  | 'neuru'
  | 'hodu'
  | 'dubu'
  | 'tori'
  | 'sogeum'
  | 'mouse_cat'
  | 'double_yarn'
  | 'paw'
  | 'fish';

export const CAT_ASSETS: Record<CatId, { name: string; title: string; src: string }> = {
  momo: {
    name: '모모',
    title: '느긋한 관찰자',
    src: '/assets/cats/momo.png',
  },
  neuru: {
    name: '느루',
    title: '잠이 많은 몽상가',
    src: '/assets/cats/neuru.png',
  },
  hodu: {
    name: '호두',
    title: '장난스러운 탐험가',
    src: '/assets/cats/hodu.png',
  },
  dubu: {
    name: '두부',
    title: '호기심 많은 산책가',
    src: '/assets/cats/dubu.png',
  },
  tori: {
    name: '토리',
    title: '조용한 사색가',
    src: '/assets/cats/tori.png',
  },
  sogeum: {
    name: '소금',
    title: '다정한 낙천가',
    src: '/assets/cats/sogeum.png',
  },
  mouse_cat: {
    name: '치즈',
    title: '장난감 사냥꾼',
    src: '/assets/cats/mouse_cat.png',
  },
  double_yarn: {
    name: '몽이',
    title: '털실 수집가',
    src: '/assets/cats/double_yarn.png',
  },
  paw: {
    name: '발자국',
    title: '행운의 스탬프',
    src: '/assets/cats/paw.png',
  },
  fish: {
    name: '생선그릇',
    title: '맛있는 간식',
    src: '/assets/cats/fish.png',
  },
};

interface CatIconProps {
  name: string;
  className?: string;
  size?: number;
  alt?: string;
}

export const CatIcon: React.FC<CatIconProps> = ({
  name,
  className = '',
  size = 32,
  alt,
}) => {
  const catKey = (name || 'momo').toLowerCase() as CatId;
  const asset = CAT_ASSETS[catKey] || CAT_ASSETS.momo;

  return (
    <img
      src={asset.src}
      alt={alt || asset.name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
      }}
      className={`inline-block select-none pointer-events-none ${className}`}
      loading="lazy"
    />
  );
};

export const PawStampIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => (
  <img
    src="/assets/cats/paw.png"
    alt="Paw"
    style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }}
    className={`inline-block select-none pointer-events-none ${className}`}
  />
);

export const FishBoneIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => (
  <img
    src="/assets/cats/fish.png"
    alt="Fish"
    style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }}
    className={`inline-block select-none pointer-events-none ${className}`}
  />
);
