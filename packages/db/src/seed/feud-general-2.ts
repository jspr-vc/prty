import type { FeudPack } from '@workspace/game-family-feud'

/** A third general-audience survey set. Nothing to know, only things to shout. */
export const generalSurveyPack2: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 people: name something you do while waiting for the rice to cook.',
      multiplier: 1,
      answers: [
        { text: 'Scroll on your phone', points: 38 },
        { text: 'Prepare the ulam', points: 24 },
        { text: 'Wash the dishes', points: 17 },
        { text: 'Wipe the table', points: 12 },
        { text: 'Set out the plates', points: 9 },
      ],
    },
    {
      question: 'Name something people pretend to know about.',
      multiplier: 1,
      answers: [
        { text: 'Politics', points: 31 },
        { text: 'Basketball', points: 26 },
        { text: 'Cars', points: 17 },
        { text: 'How to fix the wifi', points: 15 },
        { text: 'Wine', points: 11 },
      ],
    },
    {
      question: 'Name a reason people cancel plans.',
      multiplier: 2,
      answers: [
        { text: 'Too tired', points: 30 },
        { text: 'Heavy rain or a typhoon', points: 28 },
        { text: 'Feeling sick', points: 20 },
        { text: 'No budget', points: 13 },
        { text: 'Forgot', points: 9 },
      ],
    },
    {
      question: 'Name something you find in every kitchen junk drawer.',
      multiplier: 2,
      answers: [
        { text: 'Batteries', points: 29 },
        { text: 'Rubber bands', points: 25 },
        { text: 'Old chargers', points: 19 },
        { text: 'Keys to nothing', points: 15 },
        { text: 'Fast food sauce packets', points: 12 },
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
