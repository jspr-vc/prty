import type { FeudPack } from '@workspace/game-family-feud'

/**
 * The Feud counterpart to the DevOps board. Nothing here has a correct answer —
 * these are the things a room of infrastructure people will shout in unison.
 */
export const devOpsSurveyPack: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 engineers: name something you say when the deploy goes wrong.',
      multiplier: 1,
      answers: [
        { text: 'It works on my machine', points: 34 },
        { text: 'Roll it back', points: 22 },
        { text: 'Who deployed on a Friday?', points: 18 },
        { text: 'Has anyone read the logs?', points: 13 },
        { text: 'That is not my service', points: 8 },
      ],
    },
    {
      question: 'Name the first thing you check when the site goes down.',
      multiplier: 1,
      answers: [
        { text: 'The dashboard', points: 30 },
        { text: 'The logs', points: 26 },
        { text: 'What just got deployed', points: 19 },
        { text: 'Is it DNS?', points: 13 },
        { text: 'The provider status page', points: 9 },
      ],
    },
    {
      question: 'Name a reason the build is red.',
      multiplier: 2,
      answers: [
        { text: 'A failing test', points: 32 },
        { text: 'A linting or type error', points: 24 },
        { text: 'A missing environment variable', points: 18 },
        { text: 'A dependency updated itself', points: 14 },
        { text: 'Someone force-pushed', points: 7 },
      ],
    },
    {
      question: 'Name something that always breaks at three in the morning.',
      multiplier: 2,
      answers: [
        { text: 'The database', points: 29 },
        { text: 'A certificate expiring', points: 24 },
        { text: 'The disk filling up', points: 20 },
        { text: 'A cron job', points: 15 },
        { text: 'The payment provider', points: 8 },
      ],
    },
    {
      question: 'Name something engineers argue about instead of shipping.',
      multiplier: 3,
      answers: [
        { text: 'Tabs or spaces', points: 30 },
        { text: 'Which framework to use', points: 23 },
        { text: 'What to name things', points: 19 },
        { text: 'Monorepo or not', points: 15 },
        { text: 'Where the config should live', points: 9 },
      ],
    },
  ],
}
