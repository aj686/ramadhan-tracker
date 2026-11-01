import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function GamesLayout() {
  const { game } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: game.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
