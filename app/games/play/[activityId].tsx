import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CompletionScreen } from '@/components/game/completion-screen';
import { FeedbackBanner } from '@/components/game/feedback-banner';
import { GameHeader } from '@/components/game/game-header';
import { GameLayout } from '@/components/game/game-layout';
import { GameRenderer } from '@/components/game/game-renderer';
import { IconCircleButton } from '@/components/game/icon-circle-button';
import { IntroScreen } from '@/components/game/intro-screen';
import { PillButton } from '@/components/game/pill-button';
import { SegmentedProgress } from '@/components/game/segmented-progress';
import { getActivity } from '@/data/games/activities';
import type { Activity } from '@/data/games/schema';
import { useGameSession } from '@/hooks/use-game-session';
import { useGameSettings } from '@/hooks/use-game-settings';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { spacing, typography } from '@/constants/theme';

// Hints only make sense where something can be revealed.
const HINT_MECHANICS: Activity['mechanic'][] = ['choice', 'match', 'sort', 'arrange', 'puzzle', 'dots'];

const GamePlay: React.FC<{ activity: Activity }> = ({ activity }) => {
  const { game } = useTheme();
  const goBack = useGoBack(`/games/journey/${activity.journey}`);
  const session = useGameSession(activity);
  const { state, question, feedback, hintLevel, language, t, audio, start, report, requestHint, next, replay } = session;

  const isLast = state.index + 1 >= state.total;
  const canHint =
    activity.age === 'preschool' && HINT_MECHANICS.includes(activity.mechanic) && !state.solved;

  return (
    <GameLayout>
      <GameHeader onBack={goBack} backLabel={t.backToCategory}>
        {state.status === 'playing' && (
          <SegmentedProgress done={state.index + (state.solved ? 1 : 0)} total={state.total} />
        )}
      </GameHeader>

      {state.status === 'intro' && <IntroScreen activity={activity} onStart={start} />}

      {state.status === 'complete' && (
        <CompletionScreen
          activity={activity}
          stars={state.stars}
          firstTry={state.firstTry}
          total={state.total}
          onReplay={replay}
          onBack={goBack}
        />
      )}

      {state.status === 'playing' && question && (
        <View style={styles.body}>
          <View style={styles.promptRow}>
            <Text style={[styles.prompt, { color: game.text }]} accessibilityRole="header">
              {question.prompt[language]}
            </Text>
            {audio.canSpeak && !audio.muted && (
              <IconCircleButton
                icon="volume-high"
                label={t.listen}
                onPress={() => audio.say(question.say, question.audio)}
              />
            )}
          </View>

          <View style={styles.game}>
            <GameRenderer
              question={question}
              language={language}
              hintLevel={hintLevel}
              solved={state.solved}
              report={report}
              canHear={audio.canSpeak && !audio.muted}
            />
          </View>

          <View style={styles.footer}>
            <FeedbackBanner feedback={feedback} />
            {state.solved ? (
              <PillButton
                label={isLast ? t.finish : t.nextQuestion}
                icon={isLast ? 'flag' : 'arrow-forward'}
                onPress={next}
              />
            ) : (
              canHint && (
                <PillButton label={t.hint} icon="bulb" variant="light" onPress={requestHint} />
              )
            )}
          </View>
        </View>
      )}
    </GameLayout>
  );
};

export default function PlayScreen() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { game } = useTheme();
  const { t } = useGameSettings();
  const goBack = useGoBack('/games');
  const activity = getActivity(activityId ?? '');

  if (!activity) {
    return (
      <GameLayout>
        <GameHeader onBack={goBack} backLabel={t.back} />
        <View style={styles.missing}>
          <Text style={[styles.prompt, { color: game.text }]}>{t.notFound}</Text>
        </View>
      </GameLayout>
    );
  }

  return <GamePlay key={activity.id} activity={activity} />;
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  prompt: { ...typography.title3, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  game: { flex: 1 },
  footer: { minHeight: 74, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.sm, justifyContent: 'flex-end' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
