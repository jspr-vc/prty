import type { FeudPack } from '@workspace/game-family-feud'

/** Everyday questions anyone can shout an answer at, no specialist knowledge. */
export const generalSurveyPack: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 people: name something you do when you cannot sleep.',
      multiplier: 1,
      answers: [
        { text: 'Look at your phone', points: 36 },
        { text: 'Read a book', points: 21 },
        { text: 'Get a drink', points: 15 },
        { text: 'Watch television', points: 12 },
        { text: 'Count sheep', points: 9 },
        { text: 'Go for a walk', points: 4 },
      ],
    },
    {
      question: 'Name something people always lose at home.',
      multiplier: 1,
      answers: [
        { text: 'Keys', points: 40 },
        { text: 'Phone', points: 24 },
        { text: 'Remote control', points: 17 },
        { text: 'Glasses', points: 11 },
        { text: 'Socks', points: 5 },
      ],
    },
    {
      question: 'Name a food people eat straight out of the container.',
      multiplier: 2,
      answers: [
        { text: 'Ice cream', points: 34 },
        { text: 'Yoghurt', points: 22 },
        { text: 'Crisps', points: 18 },
        { text: 'Peanut butter', points: 13 },
        { text: 'Leftover takeaway', points: 8 },
      ],
    },
    {
      question: 'Name something you would take to a desert island.',
      multiplier: 2,
      answers: [
        { text: 'Water', points: 31 },
        { text: 'A knife', points: 23 },
        { text: 'Matches', points: 19 },
        { text: 'A book', points: 14 },
        { text: 'Sunscreen', points: 7 },
      ],
    },
    {
      question: 'Name a reason someone might be late to a party.',
      multiplier: 3,
      answers: [
        { text: 'Traffic', points: 38 },
        { text: 'Could not decide what to wear', points: 22 },
        { text: 'Got lost', points: 16 },
        { text: 'Fell asleep', points: 13 },
        { text: 'Still wrapping the present', points: 6 },
      ],
    },
  ],
}
