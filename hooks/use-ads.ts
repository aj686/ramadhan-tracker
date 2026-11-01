import { Platform } from 'react-native';
import { ADMOB_BANNER_UNIT } from '@/constants/ads';
import { useSubscriptionStore } from '@/store/subscription-store';

// Free users on parent screens only. Games, sign-in and premium accounts never show ads.
export const useAds = () => {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const unitId = Platform.OS === 'android' ? ADMOB_BANNER_UNIT.android : Platform.OS === 'ios' ? ADMOB_BANNER_UNIT.ios : '';

  return {
    showAds: !isPremium && unitId !== '',
    unitId,
  };
};
