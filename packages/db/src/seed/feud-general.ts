import type { FeudPack } from '@workspace/game-family-feud'

/** Everyday questions a Filipino room can shout an answer at, no specialist knowledge. */
export const generalSurveyPack: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 people: name something you do when you cannot sleep.',
      multiplier: 1,
      answers: [
        { text: 'Scroll on your phone', points: 38 },
        { text: 'Watch a K-drama or Netflix', points: 22 },
        { text: 'Eat a midnight snack', points: 16 },
        { text: 'Drink water or milk', points: 12 },
        { text: 'Pray', points: 8 },
        { text: 'Count sheep', points: 4 },
      ],
    },
    {
      question: 'Name something people always lose at home.',
      multiplier: 1,
      answers: [
        { text: 'Cellphone', points: 32 },
        { text: 'Keys', points: 25 },
        { text: 'TV remote', points: 18 },
        { text: 'Charger', points: 14 },
        { text: 'One side of the tsinelas', points: 11 },
      ],
    },
    {
      question: 'Name a food people eat straight out of the container.',
      multiplier: 2,
      answers: [
        { text: 'Ice cream', points: 34 },
        { text: 'Pancit canton', points: 22 },
        { text: 'Chichirya', points: 18 },
        { text: 'Condensed milk', points: 14 },
        { text: 'Leftover ulam', points: 12 },
      ],
    },
    {
      question: 'Name something you would bring to a deserted island.',
      multiplier: 2,
      answers: [
        { text: 'Water', points: 31 },
        { text: 'Rice', points: 24 },
        { text: 'A knife', points: 19 },
        { text: 'A lighter', points: 15 },
        { text: 'Sunblock', points: 11 },
      ],
    },
    {
      question: 'Name a reason someone might be late to a party.',
      multiplier: 3,
      answers: [
        { text: 'Traffic', points: 42 },
        { text: 'Filipino time', points: 22 },
        { text: 'Could not decide what to wear', points: 15 },
        { text: 'Fell asleep', points: 12 },
        { text: 'Could not book a Grab', points: 9 },
      ],
    },
  ],
}
