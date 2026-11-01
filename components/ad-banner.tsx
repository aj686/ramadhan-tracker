import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAds } from '@/hooks/use-ads';

type AdsModule = typeof import('react-native-google-mobile-ads');

let adsModule: Promise<AdsModule> | null = null;

// Loaded on first use, so an unconfigured build never touches the native ad module.
// Every request is flagged child-directed with G-rated, non-personalised ads,
// because this app's audience includes children.
const loadAds = (): Promise<AdsModule> => {
  if (!adsModule) {
    adsModule = import('react-native-google-mobile-ads').then(async (module) => {
      await module.default().setRequestConfiguration({
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: module.MaxAdContentRating.G,
      });
      await module.default().initialize();
      return module;
    });
  }
  return adsModule;
};

export const AdBanner: React.FC = () => {
  const { showAds, unitId } = useAds();
  const [ads, setAds] = useState<AdsModule | null>(null);

  useEffect(() => {
    if (!showAds) return;
    let active = true;
    loadAds()
      .then((module) => {
        if (active) setAds(module);
      })
      .catch(() => {
        // No ad is fine. The app must never break over one.
      });
    return () => {
      active = false;
    };
  }, [showAds]);

  if (!showAds || !ads) return null;

  const { BannerAd, BannerAdSize } = ads;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
