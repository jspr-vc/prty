import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * A second general-audience board, so a night can run two without repeating.
 * Categories are deliberately chosen to miss the ones in General Trivia — no
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
            {
              clue: 'The capital of Japan.',
              answer: 'What is Tokyo?',
              dailyDouble: false,
            },
            {
              clue: "Canada's capital, which is not Toronto.",
              answer: 'What is Ottawa?',
              dailyDouble: false,
            },
            {
              clue: "Australia's capital, which is not Sydney.",
              answer: 'What is Canberra?',
              dailyDouble: false,
            },
            {
              clue: 'Turkey moved its capital here from Istanbul in 1923.',
              answer: 'What is Ankara?',
              dailyDouble: false,
            },
            {
              clue: "Kazakhstan's capital, renamed Nur-Sultan in 2019 and changed back in 2022.",
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
              clue: 'The straw-coloured liquid making up a little over half of blood by volume.',
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
              clue: 'The first woman to fly solo across the Atlantic, in 1932.',
              answer: 'Who is Amelia Earhart?',
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
              clue: 'A red maple leaf sits at the centre of this flag.',
              answer: 'What is Canada?',
              dailyDouble: false,
            },
            {
              clue: 'A plain white field with a single red circle.',
              answer: 'What is Japan?',
              dailyDouble: false,
            },
            {
              clue: 'The only national flag that is neither a rectangle nor a square.',
              answer: 'What is Nepal?',
              dailyDouble: false,
            },
            {
              clue: 'The single-snake staff that is the actual symbol of medicine.',
              answer: 'What is the Rod of Asclepius?',
              dailyDouble: false,
            },
            {
              clue: 'The map on the United Nations flag is centred on this point.',
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
            {
              clue: 'The only even prime number.',
              answer: 'What is two?',
              dailyDouble: false,
            },
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
            {
              clue: 'The value of zero factorial.',
              answer: 'What is one?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Myth And Legend',
          clues: [
            {
              clue: 'The Greek king of the gods.',
              answer: 'Who is Zeus?',
              dailyDouble: false,
            },
            {
              clue: 'The Norse god of thunder.',
              answer: 'Who is Thor?',
              dailyDouble: false,
            },
            {
              clue: 'The Greek hero who completed twelve labours.',
              answer: 'Who is Heracles, or Hercules?',
              dailyDouble: false,
            },
            {
              clue: 'She had snakes for hair and turned those who looked at her to stone.',
              answer: 'Who is Medusa?',
              dailyDouble: true,
            },
            {
              clue: 'The jackal-headed Egyptian god associated with mummification.',
              answer: 'Who is Anubis?',
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
              clue: "Gutenberg's fifteenth-century invention that made books cheap.",
              answer: 'What is the printing press?',
              dailyDouble: false,
            },
            {
              clue: 'Tim Berners-Lee proposed this at CERN in 1989.',
              answer: 'What is the World Wide Web?',
              dailyDouble: false,
            },
            {
              clue: 'This Scot discovered penicillin by accident in 1928.',
              answer: 'Who is Alexander Fleming?',
              dailyDouble: false,
            },
            {
              clue: 'The Wright brothers made their first powered flight at this spot in 1903.',
              answer: 'What is Kitty Hawk?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Colours',
          clues: [
            {
              clue: 'Mixing blue and yellow paint gives you this.',
              answer: 'What is green?',
              dailyDouble: false,
            },
            {
              clue: 'The additive primary colours of light are red, green and this.',
              answer: 'What is blue?',
              dailyDouble: false,
            },
            {
              clue: 'The rainbow runs from red to this.',
              answer: 'What is violet?',
              dailyDouble: false,
            },
            {
              clue: 'The pigment that makes plants green.',
              answer: 'What is chlorophyll?',
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
              clue: 'The storming of this Paris prison in 1789 kicked off the French Revolution.',
              answer: 'What is the Bastille?',
              dailyDouble: false,
            },
            {
              clue: 'The 1986 nuclear disaster in what is now Ukraine.',
              answer: 'What is Chernobyl?',
              dailyDouble: false,
            },
            {
              clue: 'The charter sealed at Runnymede in 1215.',
              answer: 'What is Magna Carta?',
              dailyDouble: false,
            },
            {
              clue: 'His assassination in Sarajevo in 1914 set off the First World War.',
              answer: 'Who is Archduke Franz Ferdinand?',
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
