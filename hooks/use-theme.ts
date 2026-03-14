import { useColorScheme } from 'react-native';
import { colors, ThemeColors, ColorScheme } from '@/constants/theme';
import { useThemeStore } from '@/store/theme-store';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { preference } = useThemeStore();

  let colorScheme: ColorScheme;
  if (preference === 'system') {
    colorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    colorScheme = preference;
  }

  const theme: ThemeColors = colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return {
    colors: theme,
    colorScheme,
    isDark,
  };
};
