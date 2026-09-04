import type { FeudPack } from '@workspace/game-family-feud'

/** A third general-audience survey set. Nothing to know, only things to shout. */
export const generalSurveyPack2: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 people: name something you do while the kettle boils.',
      multiplier: 1,
      answers: [
        { text: 'Look at your phone', points: 38 },
        { text: 'Get a mug out', points: 22 },
        { text: 'Stare at it', points: 17 },
        { text: 'Wipe the counter', points: 13 },
        { text: 'Empty the dishwasher', points: 10 },
      ],
    },
    {
      question: 'Name something people pretend to know about.',
      multiplier: 1,
      answers: [
        { text: 'Wine', points: 31 },
        { text: 'Football', points: 24 },
        { text: 'Politics', points: 19 },
        { text: 'Cars', points: 15 },
        { text: 'How to fix the wifi', points: 11 },
      ],
    },
    {
      question: 'Name a reason people cancel plans.',
      multiplier: 2,
      answers: [
        { text: 'Too tired', points: 33 },
        { text: 'The weather', points: 22 },
        { text: 'Feeling ill', points: 20 },
        { text: 'Something better came up', points: 15 },
        { text: 'Forgot', points: 10 },
      ],
    },
    {
      question: 'Name something you find in every kitchen junk drawer.',
      multiplier: 2,
      answers: [
        { text: 'Batteries', points: 29 },
        { text: 'Takeaway menus', points: 24 },
        { text: 'Rubber bands', points: 19 },
        { text: 'Keys to nothing', points: 16 },
        { text: 'A single chopstick', points: 12 },
      ],
    },
    {
      question: 'Name a superpower people wish they had.',
      multiplier: 3,
      answers: [
        { text: 'Flying', points: 34 },
        { text: 'Invisibility', points: 25 },
        { text: 'Time travel', points: 18 },
        { text: 'Reading minds', points: 15 },
        { text: 'Teleporting', points: 8 },
      ],
    },
  ],
}
