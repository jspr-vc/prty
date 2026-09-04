import type { FeudPack } from '@workspace/game-family-feud'

/**
 * A second general-audience survey set, aimed squarely at a room that has had a
 * drink. Nothing here needs any knowledge at all — only nerve.
 */
export const partySurveyPack: FeudPack = {
  rounds: [
    {
      question: 'Name something people bring to a house party.',
      multiplier: 1,
      answers: [
        { text: 'Drinks', points: 37 },
        { text: 'Crisps or snacks', points: 24 },
        { text: 'Ice', points: 17 },
        { text: 'Dessert', points: 12 },
        { text: 'A friend nobody invited', points: 6 },
      ],
    },
    {
      question: 'Name something you do the morning after a big night out.',
      multiplier: 1,
      answers: [
        { text: 'Drink a lot of water', points: 32 },
        { text: 'Go back to sleep', points: 25 },
        { text: 'Order a takeaway', points: 18 },
        { text: 'Check your phone with regret', points: 14 },
        { text: 'Have a very long shower', points: 7 },
      ],
    },
    {
      question: 'Name something families argue about at a gathering.',
      multiplier: 2,
      answers: [
        { text: 'Politics', points: 30 },
        { text: 'Who is paying', points: 24 },
        { text: 'The last slice', points: 19 },
        { text: 'The television remote', points: 15 },
        { text: 'Something from twenty years ago', points: 8 },
      ],
    },
    {
      question: 'Name something you always find at the bottom of a bag.',
      multiplier: 2,
      answers: [
        { text: 'Old receipts', points: 29 },
        { text: 'Loose change', points: 25 },
        { text: 'Crumbs', points: 19 },
        { text: 'A pen that does not work', points: 15 },
        { text: 'A single earring', points: 8 },
      ],
    },
    {
      question: 'Name a chore that everybody puts off.',
      multiplier: 3,
      answers: [
        { text: 'The washing up', points: 29 },
        { text: 'Laundry', points: 24 },
        { text: 'Cleaning the bathroom', points: 20 },
        { text: 'Ironing', points: 15 },
        { text: 'Hoovering', points: 9 },
      ],
    },
  ],
}
