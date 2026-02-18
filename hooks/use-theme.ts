import { useColorScheme } from 'react-native';
import { colors, ThemeColors, ColorScheme } from '@/constants/theme';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const colorScheme: ColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  const theme: ThemeColors = colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return {
    colors: theme,
    colorScheme,
    isDark,
  };
};
