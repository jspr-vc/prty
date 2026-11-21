import type { FeudPack } from '@workspace/game-family-feud'

/**
 * A second general-audience survey set, aimed squarely at a room that has had a
 * drink. Nothing here needs any knowledge at all, only nerve.
 */
export const partySurveyPack: FeudPack = {
  rounds: [
    {
      question: 'Name something people bring to a house party.',
      multiplier: 1,
      answers: [
        { text: 'Drinks', points: 35 },
        { text: 'Pulutan', points: 27 },
        { text: 'Ice', points: 17 },
        { text: 'Cake or leche flan', points: 13 },
        { text: 'A plus-one nobody invited', points: 8 },
      ],
    },
    {
      question: 'Name something you do the morning after a big night out.',
      multiplier: 1,
      answers: [
        { text: 'Drink a lot of water', points: 32 },
        { text: 'Go back to sleep', points: 25 },
        { text: 'Eat something with hot sabaw', points: 20 },
        { text: 'Check your phone with regret', points: 14 },
        { text: 'Take a very long shower', points: 9 },
      ],
    },
    {
      question: 'Name something families argue about at a reunion.',
      multiplier: 2,
      answers: [
        { text: 'Politics', points: 31 },
        { text: 'Land or inheritance', points: 25 },
        { text: 'Who is paying', points: 20 },
        { text: 'Why you are still single', points: 14 },
        { text: 'Something from twenty years ago', points: 10 },
      ],
    },
    {
      question: 'Name something you always find at the bottom of a bag.',
      multiplier: 2,
      answers: [
        { text: 'Old receipts', points: 29 },
        { text: 'Loose coins', points: 25 },
        { text: 'Crumbs', points: 19 },
        { text: 'A pen that does not work', points: 15 },
        { text: 'A single earring', points: 12 },
      ],
    },
    {
      question: 'Name a chore that everybody puts off.',
      multiplier: 3,
      answers: [
        { text: 'Washing the dishes', points: 30 },
        { text: 'Laundry', points: 25 },
        { text: 'Cleaning the bathroom', points: 20 },
        { text: 'Ironing', points: 15 },
        { text: 'Sweeping the floor', points: 10 },
      ],
    },
  ],
}
