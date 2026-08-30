import type { FeudPack } from '@workspace/game-family-feud'

export const devSurveyPack: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 developers: name something you do instead of writing tests.',
      multiplier: 1,
      answers: [
        { text: 'Manually click through the app', points: 34 },
        { text: 'Refactor something unrelated', points: 22 },
        { text: 'Read documentation', points: 15 },
        { text: 'Ship it and watch the logs', points: 12 },
        { text: 'Argue about naming', points: 9 },
        { text: 'Update dependencies', points: 5 },
      ],
    },
    {
      question: 'Name a reason a build fails on CI but not on your machine.',
      multiplier: 2,
      answers: [
        { text: 'Different Node or language version', points: 31 },
        { text: 'Missing environment variable', points: 26 },
        { text: 'Case-sensitive file paths', points: 18 },
        { text: 'Stale local cache', points: 13 },
        { text: 'Uncommitted file', points: 8 },
        { text: 'Flaky test', points: 4 },
      ],
    },
    {
      question: 'Name something a developer says when the demo breaks.',
      multiplier: 2,
      answers: [
        { text: 'It worked five minutes ago', points: 38 },
        { text: 'Let me refresh', points: 24 },
        { text: 'That is just a caching issue', points: 16 },
        { text: 'Wrong environment', points: 12 },
        { text: 'Ignore that error', points: 10 },
      ],
    },
    {
      question: 'Name a place developers hide secrets they should not.',
      multiplier: 3,
      answers: [
        { text: 'Committed .env file', points: 35 },
        { text: 'Hardcoded in source', points: 28 },
        { text: 'A Slack message', points: 17 },
        { text: 'CI config', points: 11 },
        { text: 'A sticky note', points: 9 },
      ],
    },
    {
      question: 'Name something that makes a pull request hard to review.',
      multiplier: 3,
      answers: [
        { text: 'It is far too large', points: 41 },
        { text: 'No description', points: 23 },
        { text: 'Mixed refactor and feature', points: 16 },
        { text: 'Generated files in the diff', points: 12 },
        { text: 'Formatting-only churn', points: 8 },
      ],
    },
  ],
}
