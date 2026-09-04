import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * A third general-audience board. Picks categories neither General Trivia nor
 * Pub Quiz touch: space, television, languages, art, money, games and the sea.
 */
export const generalTriviaPack2: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'Out In Space',
          clues: [
            {
              clue: 'The planet known as the Red Planet.',
              answer: 'What is Mars?',
              dailyDouble: false,
            },
            {
              clue: 'The largest planet in the solar system.',
              answer: 'What is Jupiter?',
              dailyDouble: false,
            },
            {
              clue: 'The galaxy we live in.',
              answer: 'What is the Milky Way?',
              dailyDouble: false,
            },
            {
              clue: 'The first artificial satellite, launched by the Soviet Union in 1957.',
              answer: 'What is Sputnik?',
              dailyDouble: false,
            },
            {
              clue: 'The planet with the most known moons, having overtaken Jupiter in 2023.',
              answer: 'What is Saturn?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'On The Telly',
          clues: [
            {
              clue: 'The yellow animated family from Springfield.',
              answer: 'Who are The Simpsons?',
              dailyDouble: false,
            },
            {
              clue: 'The sitcom about six New Yorkers and a coffee shop called Central Perk.',
              answer: 'What is Friends?',
              dailyDouble: false,
            },
            {
              clue: 'The fantasy series that ended in 2019 with the fight for the Iron Throne.',
              answer: 'What is Game of Thrones?',
              dailyDouble: false,
            },
            {
              clue: 'The chemistry teacher turned drug lord in Breaking Bad.',
              answer: 'Who is Walter White?',
              dailyDouble: true,
            },
            {
              clue: 'The longest-running science-fiction show on television, first broadcast in 1963.',
              answer: 'What is Doctor Who?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Lost In Translation',
          clues: [
            {
              clue: 'The language with the most native speakers in the world.',
              answer: 'What is Mandarin?',
              dailyDouble: false,
            },
            {
              clue: "'Danke' means thank you in this language.",
              answer: 'What is German?',
              dailyDouble: false,
            },
            {
              clue: 'The official language of Brazil.',
              answer: 'What is Portuguese?',
              dailyDouble: false,
            },
            {
              clue: "The language invented in 1887 to be everyone's second language.",
              answer: 'What is Esperanto?',
              dailyDouble: false,
            },
            {
              clue: 'The alphabet Russian is written in, named after a ninth-century saint.',
              answer: 'What is Cyrillic?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Art Gallery',
          clues: [
            {
              clue: "Leonardo's portrait with the famous smile.",
              answer: 'What is the Mona Lisa?',
              dailyDouble: false,
            },
            {
              clue: 'He painted The Starry Night and cut off part of his own ear.',
              answer: 'Who is Vincent van Gogh?',
              dailyDouble: false,
            },
            {
              clue: 'The Spanish artist behind Guernica.',
              answer: 'Who is Pablo Picasso?',
              dailyDouble: false,
            },
            {
              clue: 'He painted the ceiling of the Sistine Chapel.',
              answer: 'Who is Michelangelo?',
              dailyDouble: false,
            },
            {
              clue: 'This Norwegian painted The Scream.',
              answer: 'Who is Edvard Munch?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Money Talks',
          clues: [
            {
              clue: 'The currency of Japan.',
              answer: 'What is the yen?',
              dailyDouble: false,
            },
            {
              clue: 'The currency that arrived as notes and coins across much of Europe in 2002.',
              answer: 'What is the euro?',
              dailyDouble: false,
            },
            {
              clue: 'The face on the US hundred-dollar bill, who was never president.',
              answer: 'Who is Benjamin Franklin?',
              dailyDouble: false,
            },
            {
              clue: 'The metal that backed the US dollar until 1971.',
              answer: 'What is gold?',
              dailyDouble: false,
            },
            {
              clue: 'The first cryptocurrency, launched in 2009 by the pseudonymous Satoshi Nakamoto.',
              answer: 'What is Bitcoin?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
    {
      name: 'Double Jeopardy',
      values: [400, 800, 1200, 1600, 2000],
      categories: [
        {
          name: 'Planet Earth',
          clues: [
            {
              clue: 'The highest mountain on Earth.',
              answer: 'What is Everest?',
              dailyDouble: false,
            },
            {
              clue: 'The largest ocean.',
              answer: 'What is the Pacific?',
              dailyDouble: false,
            },
            {
              clue: 'The largest hot desert in the world.',
              answer: 'What is the Sahara?',
              dailyDouble: false,
            },
            {
              clue: 'The atmospheric layer with a hole over Antarctica.',
              answer: 'What is the ozone layer?',
              dailyDouble: false,
            },
            {
              clue: 'The deepest known point in the ocean, at the bottom of the Mariana Trench.',
              answer: 'What is Challenger Deep?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Game Night',
          clues: [
            {
              clue: 'The board game in which you can buy Park Lane, or Boardwalk.',
              answer: 'What is Monopoly?',
              dailyDouble: false,
            },
            {
              clue: 'Each side starts this game with a king, a queen and eight pawns.',
              answer: 'What is chess?',
              dailyDouble: false,
            },
            {
              clue: 'The word game in which the Q tile is worth ten points.',
              answer: 'What is Scrabble?',
              dailyDouble: false,
            },
            {
              clue: 'Colonel Mustard did it with the candlestick in this game.',
              answer: 'What is Cluedo, or Clue?',
              dailyDouble: true,
            },
            {
              clue: 'The 1995 German board game about settling an island and trading wood, brick, sheep, wheat and ore.',
              answer: 'What is Catan?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Under The Sea',
          clues: [
            {
              clue: 'The clownfish who went missing in a 2003 Pixar film.',
              answer: 'Who is Nemo?',
              dailyDouble: false,
            },
            {
              clue: 'The largest fish in the sea, a gentle filter feeder.',
              answer: 'What is the whale shark?',
              dailyDouble: false,
            },
            {
              clue: 'This sea creature is about 95% water and has no brain, heart or bones.',
              answer: 'What is a jellyfish?',
              dailyDouble: false,
            },
            {
              clue: "The world's largest coral reef, off the coast of Australia.",
              answer: 'What is the Great Barrier Reef?',
              dailyDouble: false,
            },
            {
              clue: 'In seahorses, this parent carries the eggs until they hatch.',
              answer: 'What is the male, or the father?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Holidays',
          clues: [
            {
              clue: 'The 25th of December.',
              answer: 'What is Christmas?',
              dailyDouble: false,
            },
            {
              clue: 'The Hindu festival of lights.',
              answer: 'What is Diwali?',
              dailyDouble: false,
            },
            {
              clue: 'The Islamic month of fasting, which ends with Eid al-Fitr.',
              answer: 'What is Ramadan?',
              dailyDouble: false,
            },
            {
              clue: "Mexico's Day of the Dead falls at the start of this month.",
              answer: 'What is November?',
              dailyDouble: false,
            },
            {
              clue: "The Jewish new year, whose name means 'head of the year'.",
              answer: 'What is Rosh Hashanah?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Superheroes',
          clues: [
            {
              clue: "Bruce Wayne's caped alter ego.",
              answer: 'Who is Batman?',
              dailyDouble: false,
            },
            {
              clue: 'The green mineral that weakens Superman.',
              answer: 'What is kryptonite?',
              dailyDouble: false,
            },
            {
              clue: 'Peter Parker got his powers from a bite from one of these.',
              answer: 'What is a spider?',
              dailyDouble: false,
            },
            {
              clue: "Thor's hammer, which only the worthy can lift.",
              answer: 'What is Mjolnir?',
              dailyDouble: false,
            },
            {
              clue: "Wonder Woman's home island.",
              answer: 'What is Themyscira?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'The Seven Wonders',
    clue: 'The only one of the Seven Wonders of the Ancient World still standing.',
    answer: 'What is the Great Pyramid of Giza?',
  },
}
