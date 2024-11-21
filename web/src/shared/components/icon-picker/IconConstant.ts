import { IconInfo } from '@/shared/components/icon-picker/IconInfo';
import { IconNames } from '@/shared/components/icon-picker/IconNames';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const AllIcons: { groupName: string; icons: IconInfo[] }[] = require('@/shared/components/icon-picker/icons.json');
export interface IconBorder {
  displayName: string;
  radiusValue: string;
}
export const IconBorders: IconBorder[] = [
  {
    displayName: 'light border',
    radiusValue: '4px'
  },
  {
    displayName: 'circle',
    radiusValue: '50%'
  },
  {
    displayName: 'heavy border',
    radiusValue: '12px'
  },
  {
    displayName: 'square',
    radiusValue: '0'
  }
];

export interface IconColor {
  displayName: string;
  color: string;
  border: string;
}

export const IconColors: IconColor[] = [
  {
    displayName: '',
    color: '#14B8A6',
    border: '0.5px solid #14B8A6'
  },
  {
    displayName: '',
    color: '#E1FBFF',
    border: '0.5px solid #E1FBFF'
  },
  {
    displayName: '',
    color: '#3B82F6',
    border: '0.5px solid #3B82F6'
  },
  {
    displayName: '',
    color: '#F59E0B',
    border: '0.5px solid #F59E0B'
  },
  {
    displayName: '',
    color: '#FACC15',
    border: '0.5px solid #FACC15'
  },
  {
    displayName: '',
    color: '#6366F1',
    border: '0.5px solid #6366F1'
  },
  {
    displayName: '',
    color: '#93C5FD',
    border: '0.5px solid #93C5FD'
  },
  {
    displayName: '',
    color: '#07BC40',
    border: '0.5px solid #07BC40'
  },
  {
    displayName: '',
    color: '#BEE2CA',
    border: '0.5px solid #BEE2CA'
  },
  {
    displayName: '',
    color: '#F8D2B5',
    border: '0.5px solid #F8D2B5'
  },
  {
    displayName: '',
    color: '#49982E',
    border: '0.5px solid #49982E'
  },
  {
    displayName: '',
    color: '#C9ABC2',
    border: '0.5px solid #C9ABC2'
  },
  {
    displayName: '',
    color: '#8E9BB6',
    border: '0.5px solid #8E9BB6'
  },
  {
    displayName: '',
    color: '#FFFFFF',
    border: '0.5px solid #F0F0F0'
  },
  {
    displayName: '',
    color: '#11152D',
    border: '0.5px solid #11152D'
  }
];

export const IconBackgroundColors: IconColor[] = [
  {
    displayName: '',
    color: '#11152D',
    border: '0.5px solid #11152D'
  },
  {
    displayName: '',
    color: '#FFFFFF',
    border: '0.5px solid #F2F2F7'
  },
  {
    displayName: '',
    color: '#14B8A6',
    border: '0.5px solid #14B8A6'
  },
  {
    displayName: '',
    color: '#E1FBFF',
    border: '0.5px solid #E1FBFF'
  },
  {
    displayName: '',
    color: '#3B82F6',
    border: '0.5px solid #3B82F6'
  },
  {
    displayName: '',
    color: '#F59E0B',
    border: '0.5px solid #F59E0B'
  },
  {
    displayName: '',
    color: '#FACC15',
    border: '0.5px solid #FACC15'
  },
  {
    displayName: '',
    color: '#6366F1',
    border: '0.5px solid #FACC15'
  },
  {
    displayName: '',
    color: '#93C5FD',
    border: '0.5px solid #93C5FD'
  },
  {
    displayName: '',
    color: '#07BC40',
    border: '0.5px solid #07BC40'
  },
  {
    displayName: '',
    color: '#BEE2CA',
    border: '0.5px solid #BEE2CA'
  },
  {
    displayName: '',
    color: '#F8D2B5',
    border: '0.5px solid #F8D2B5'
  },
  {
    displayName: '',
    color: '#49982E',
    border: '0.5px solid #49982E'
  },
  {
    displayName: '',
    color: '#C9ABC2',
    border: '0.5px solid #C9ABC2'
  },
  {
    displayName: '',
    color: '#8E9BB6',
    border: '0.5px solid #8E9BB6'
  },
  {
    displayName: '',
    color: '#EC4899',
    border: '0.5px solid #EC4899'
  },
  {
    displayName: '',
    color: 'linear-gradient(90deg, #A855F7 0%, #3B82F6 100%)',
    border: '0'
  },
  {
    displayName: '',
    color: 'linear-gradient(90deg, #EC4899 0%, #A855F7 52.60%, #3B82F6 100%)',
    border: '0'
  },
  {
    displayName: '',
    color: 'linear-gradient(180deg, #6D63FF 0%, #3B32C0 100%)',
    border: '0'
  },
  {
    displayName: '',
    color: 'linear-gradient(70deg, #142850 0%, #466AEC 100%)',
    border: '0'
  },
  {
    displayName: '',
    color: 'linear-gradient(67deg, #F059B4 0%, #900C3F 100%)',
    border: '0'
  },
  {
    displayName: '',
    color: 'linear-gradient(339deg, #1B59F8 0%, rgba(27, 89, 248, 0.46) 100%)',
    border: '0'
  },
  {
    displayName: '',
    color: 'linear-gradient(32deg, #568E8B 0%, #67F5ED 77.60%);',
    border: '0'
  }
];
