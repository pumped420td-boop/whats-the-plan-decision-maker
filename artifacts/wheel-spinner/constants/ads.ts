/**
 * AdMob configuration points.
 *
 * Development uses Google's official test IDs. Set the EXPO_PUBLIC_* values
 * to the production IDs from AdMob before creating a release build.
 */
const ads = {
  androidAppId:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ??
    'ca-app-pub-3940256099942544~3347511713',
  bannerUnitId:
    process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ??
    'ca-app-pub-3940256099942544/6300978111',
};

export default ads;