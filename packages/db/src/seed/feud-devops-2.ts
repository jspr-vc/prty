import type { FeudPack } from '@workspace/game-family-feud'

/** A second infrastructure survey set. Same room, fresh grievances. */
export const devOpsSurveyPack2: FeudPack = {
  rounds: [
    {
      question: 'We asked 100 engineers: name something you find on a legacy server.',
      multiplier: 1,
      answers: [
        { text: 'A cron job nobody understands', points: 32 },
        { text: 'An expired certificate', points: 24 },
        { text: 'A root password in a text file', points: 17 },
        { text: 'A folder called backup_final_v2', points: 15 },
        { text: 'A process running since 2014', points: 12 },
      ],
    },
    {
      question: 'Name a reason the cloud bill went up.',
      multiplier: 1,
      answers: [
        { text: 'Someone left instances running', points: 34 },
        { text: 'Egress charges', points: 22 },
        { text: 'Logs nobody reads', points: 18 },
        { text: 'A forgotten test environment', points: 16 },
        { text: 'Autoscaling did its job', points: 10 },
      ],
    },
    {
      question: 'Name something you say on the incident call.',
      multiplier: 2,
      answers: [
        { text: 'Is anyone looking at this?', points: 30 },
        { text: 'Can someone share their screen?', points: 24 },
        { text: 'Let us roll back', points: 20 },
        { text: 'Who has access?', points: 16 },
        { text: 'Sorry, I was on mute', points: 10 },
      ],
    },
    {
      question: "Name a change that 'could not possibly break anything'.",
      multiplier: 2,
      answers: [
        { text: 'A config change', points: 33 },
        { text: 'A one-line fix', points: 27 },
        { text: 'A DNS update', points: 18 },
        { text: 'A dependency bump', points: 14 },
        { text: 'Renaming a variable', points: 8 },
      ],
    },
    {
      question: 'Name something you learn about your monitoring during an outage.',
      multiplier: 3,
      answers: [
        { text: 'The alerts never fired', points: 31 },
        { text: 'The dashboard was wrong', points: 25 },
        { text: 'The logs had rotated away', points: 18 },
        { text: 'The pager went to someone who left', points: 15 },
        { text: 'Nobody was on call', points: 11 },
      ],
    },
  ],
}
