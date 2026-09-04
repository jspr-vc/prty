import type { FeudPack } from '@workspace/game-family-feud'

/** A second developer survey set, so a night can run two without repeating. */
export const devSurveyPack2: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 developers: name something you Google every single time.',
      multiplier: 1,
      answers: [
        { text: 'Regex syntax', points: 30 },
        { text: 'How to exit vim', points: 22 },
        { text: 'Date formatting', points: 18 },
        { text: 'The git command to undo the last thing', points: 15 },
        { text: 'How to centre a div', points: 10 },
      ],
    },
    {
      question: 'Name something that shows up in every code review.',
      multiplier: 1,
      answers: [
        { text: 'A nitpick about naming', points: 33 },
        { text: 'A console.log left in', points: 25 },
        { text: 'A formatting comment', points: 17 },
        { text: '"Can you add a test?"', points: 14 },
        { text: 'A typo in a comment', points: 11 },
      ],
    },
    {
      question: 'Name an excuse for a bug in production.',
      multiplier: 2,
      answers: [
        { text: 'It was like that when I got here', points: 30 },
        { text: 'The requirements changed', points: 24 },
        { text: 'Nobody tested that path', points: 19 },
        { text: 'It is an edge case', points: 16 },
        { text: 'The library did it', points: 11 },
      ],
    },
    {
      question: "Name something a developer says is 'almost done'.",
      multiplier: 2,
      answers: [
        { text: 'The refactor', points: 31 },
        { text: 'The migration', points: 22 },
        { text: 'The documentation', points: 20 },
        { text: 'The side project', points: 17 },
        { text: 'The tests', points: 10 },
      ],
    },
    {
      question: 'Name a browser tab you always have open.',
      multiplier: 3,
      answers: [
        { text: 'Stack Overflow', points: 35 },
        { text: 'The docs', points: 24 },
        { text: 'GitHub', points: 18 },
        { text: 'An AI chat', points: 13 },
        { text: 'The ticket you are avoiding', points: 10 },
      ],
    },
  ],
}
