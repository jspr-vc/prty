import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * A second general-audience board, so a night can run two without repeating.
 * Categories are deliberately chosen to miss the ones in General Trivia: no
 * film, food, sport or animals here.
 */
export const pubQuizPack: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'Capital Cities',
          clues: [
            { clue: 'The capital of Japan.', answer: 'What is Tokyo?', dailyDouble: false },
            {
              clue: 'Vietnam’s capital, which is not Ho Chi Minh City.',
              answer: 'What is Hanoi?',
              dailyDouble: false,
            },
            {
              clue: 'Australia’s capital, which is not Sydney.',
              answer: 'What is Canberra?',
              dailyDouble: false,
            },
            {
              clue: 'Myanmar moved its capital here from Yangon in the mid-2000s.',
              answer: 'What is Naypyidaw?',
              dailyDouble: false,
            },
            {
              clue: 'Kazakhstan’s capital, renamed Nur-Sultan in 2019 and changed back in 2022.',
              answer: 'What is Astana?',
              dailyDouble: true,
            },
          ],
        },
        {
          name: 'The Human Body',
          clues: [
            {
              clue: 'The largest organ of the human body.',
              answer: 'What is the skin?',
              dailyDouble: false,
            },
            {
              clue: 'The number of bones in an adult skeleton.',
              answer: 'What is 206?',
              dailyDouble: false,
            },
            {
              clue: 'The bone usually called the collarbone.',
              answer: 'What is the clavicle?',
              dailyDouble: false,
            },
            {
              clue: 'The straw-colored liquid making up a little over half of blood by volume.',
              answer: 'What is plasma?',
              dailyDouble: false,
            },
            {
              clue: 'The smallest bone in the body, found in the middle ear.',
              answer: 'What is the stapes, or stirrup?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Famous Firsts',
          clues: [
            {
              clue: 'The first person to walk on the Moon.',
              answer: 'Who is Neil Armstrong?',
              dailyDouble: false,
            },
            {
              clue: 'The first woman to win a Nobel Prize.',
              answer: 'Who is Marie Curie?',
              dailyDouble: false,
            },
            {
              clue: 'In 1893 it became the first self-governing country to give women the vote.',
              answer: 'What is New Zealand?',
              dailyDouble: false,
            },
            {
              clue: 'The first human in space, in April 1961.',
              answer: 'Who is Yuri Gagarin?',
              dailyDouble: false,
            },
            {
              clue: 'After the 1986 snap election and EDSA, she became the first woman president of the Philippines.',
              answer: 'Who is Corazon Aquino?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Wordplay',
          clues: [
            {
              clue: 'A word that reads the same backwards, such as "level".',
              answer: 'What is a palindrome?',
              dailyDouble: false,
            },
            {
              clue: 'Words that sound alike but are spelled differently, such as "their" and "there".',
              answer: 'What are homophones?',
              dailyDouble: false,
            },
            {
              clue: 'A word made by rearranging the letters of another.',
              answer: 'What is an anagram?',
              dailyDouble: false,
            },
            {
              clue: 'A sentence that uses every letter of the alphabet.',
              answer: 'What is a pangram?',
              dailyDouble: false,
            },
            {
              clue: 'The figure of speech at work in "the wind whispered through the trees".',
              answer: 'What is personification?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Flags And Symbols',
          clues: [
            {
              clue: 'A plain white field with a single red circle.',
              answer: 'What is Japan?',
              dailyDouble: false,
            },
            {
              clue: 'This country’s flag has a white triangle, a sun with eight rays and three stars.',
              answer: 'What is the Philippines?',
              dailyDouble: false,
            },
            {
              clue: 'The only national flag that is neither a rectangle nor a square.',
              answer: 'What is Nepal?',
              dailyDouble: false,
            },
            {
              clue: 'The Philippine flag is flown with its red field on top to signal this.',
              answer: 'What is a state of war?',
              dailyDouble: false,
            },
            {
              clue: 'The map on the United Nations flag is centered on this point.',
              answer: 'What is the North Pole?',
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
          name: 'By The Numbers',
          clues: [
            { clue: 'The only even prime number.', answer: 'What is two?', dailyDouble: false },
            {
              clue: 'The interior angles of any triangle add up to this many degrees.',
              answer: 'What is 180?',
              dailyDouble: false,
            },
            {
              clue: 'The Greek letter standing for a circle’s circumference divided by its diameter.',
              answer: 'What is pi?',
              dailyDouble: false,
            },
            {
              clue: 'In this sequence, each number is the sum of the two before it.',
              answer: 'What is the Fibonacci sequence?',
              dailyDouble: false,
            },
            { clue: 'The value of zero factorial.', answer: 'What is one?', dailyDouble: false },
          ],
        },
        {
          name: 'Myth And Legend',
          clues: [
            {
              clue: 'This Philippine creature splits at the waist and flies off with its upper half.',
              answer: 'What is a manananggal?',
              dailyDouble: false,
            },
            {
              clue: 'The horse-headed trickster of Philippine folklore who leads travelers astray.',
              answer: 'What is a tikbalang?',
              dailyDouble: false,
            },
            {
              clue: 'In Greek myth, she had snakes for hair and turned those who looked at her to stone.',
              answer: 'Who is Medusa?',
              dailyDouble: false,
            },
            {
              clue: 'The monkey god who helps Rama in the Ramayana.',
              answer: 'Who is Hanuman?',
              dailyDouble: true,
            },
            {
              clue: 'The Visayan sea serpent said to swallow the moon during an eclipse.',
              answer: 'What is the Bakunawa?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Inventions',
          clues: [
            {
              clue: 'Alexander Graham Bell is credited with patenting this in 1876.',
              answer: 'What is the telephone?',
              dailyDouble: false,
            },
            {
              clue: 'Paper, printing, gunpowder and this navigation tool are the Four Great Inventions of China.',
              answer: 'What is the compass?',
              dailyDouble: false,
            },
            {
              clue: 'Tim Berners-Lee proposed this at CERN in 1989.',
              answer: 'What is the World Wide Web?',
              dailyDouble: false,
            },
            {
              clue: 'This scientist discovered penicillin by accident in 1928.',
              answer: 'Who is Alexander Fleming?',
              dailyDouble: false,
            },
            {
              clue: 'This Filipina pediatrician designed a bamboo incubator for rural homes without electricity.',
              answer: 'Who is Fe del Mundo?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Colors',
          clues: [
            {
              clue: 'Mixing blue and yellow paint gives you this.',
              answer: 'What is green?',
              dailyDouble: false,
            },
            {
              clue: 'The additive primary colors of light are red, green and this.',
              answer: 'What is blue?',
              dailyDouble: false,
            },
            {
              clue: 'The rainbow runs from red to this.',
              answer: 'What is violet?',
              dailyDouble: false,
            },
            {
              clue: 'The orange pigment that gives carrots their color.',
              answer: 'What is beta-carotene?',
              dailyDouble: false,
            },
            {
              clue: 'Ground from lapis lazuli, this blue pigment once cost more than gold.',
              answer: 'What is ultramarine?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Turning Points',
          clues: [
            {
              clue: 'The Second World War ended in this year.',
              answer: 'What is 1945?',
              dailyDouble: false,
            },
            {
              clue: 'The month-long 1945 battle that left this Asian capital in ruins.',
              answer: 'What is Manila?',
              dailyDouble: false,
            },
            {
              clue: 'The 1986 nuclear disaster in what is now Ukraine.',
              answer: 'What is Chernobyl?',
              dailyDouble: false,
            },
            {
              clue: 'The 1942 forced march of Filipino and American prisoners of war toward Capas, Tarlac.',
              answer: 'What is the Bataan Death March?',
              dailyDouble: false,
            },
            {
              clue: 'His assassination at the Manila airport in 1983 galvanized the opposition to Marcos.',
              answer: 'Who is Ninoy Aquino?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'World Rivers',
    clue: 'It is the only major river to cross the equator twice.',
    answer: 'What is the Congo?',
  },
}
