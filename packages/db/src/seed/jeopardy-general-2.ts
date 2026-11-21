import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * A third general-audience board. Picks categories neither General Trivia nor
 * Barkada Quiz touch: space, television, languages, art, money, games and the sea.
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
          name: 'On TV',
          clues: [
            {
              clue: 'The long-running Philippine noontime show that made "Dabarkads" a household word.',
              answer: 'What is Eat Bulaga?',
              dailyDouble: false,
            },
            {
              clue: 'Coco Martin starred as Cardo Dalisay in this long-running action series.',
              answer: 'What is FPJ’s Ang Probinsyano?',
              dailyDouble: false,
            },
            {
              clue: 'The South Korean Netflix drama in which debtors play deadly children’s games.',
              answer: 'What is Squid Game?',
              dailyDouble: false,
            },
            {
              clue: 'The straw-hatted pirate captain at the center of One Piece.',
              answer: 'Who is Monkey D. Luffy?',
              dailyDouble: true,
            },
            {
              clue: 'This Japanese robot anime was pulled from Philippine TV in 1979 under martial law, then remade by GMA in 2023.',
              answer: 'What is Voltes V?',
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
              clue: '"Maayong buntag" means good morning in this Philippine language.',
              answer: 'What is Cebuano, or Bisaya?',
              dailyDouble: false,
            },
            {
              clue: 'The official language of Brazil.',
              answer: 'What is Portuguese?',
              dailyDouble: false,
            },
            {
              clue: 'The precolonial Tagalog script whose characters each stand for a syllable.',
              answer: 'What is Baybayin?',
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
              clue: 'Leonardo’s portrait with the famous smile.',
              answer: 'What is the Mona Lisa?',
              dailyDouble: false,
            },
            {
              clue: 'The Mexican painter known for her self-portraits and her unbroken brow.',
              answer: 'Who is Frida Kahlo?',
              dailyDouble: false,
            },
            {
              clue: 'The Japanese artist behind The Great Wave off Kanagawa.',
              answer: 'Who is Hokusai?',
              dailyDouble: false,
            },
            {
              clue: 'Juan Luna’s giant canvas that won gold at the 1884 Madrid Exposition.',
              answer: 'What is the Spoliarium?',
              dailyDouble: false,
            },
            {
              clue: 'The first National Artist of the Philippines, known for sunlit rural scenes.',
              answer: 'Who is Fernando Amorsolo?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Money Talks',
          clues: [
            {
              clue: 'The currency of the Philippines.',
              answer: 'What is the peso?',
              dailyDouble: false,
            },
            { clue: 'The currency of Japan.', answer: 'What is the yen?', dailyDouble: false },
            {
              clue: 'The most widely used mobile wallet in the Philippines, ahead of Maya.',
              answer: 'What is GCash?',
              dailyDouble: false,
            },
            {
              clue: 'The year-end pay every rank-and-file Filipino employee is entitled to by law.',
              answer: 'What is 13th month pay?',
              dailyDouble: false,
            },
            {
              clue: 'The Filipino savings circle in which members take turns collecting the pot.',
              answer: 'What is a paluwagan?',
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
              clue: 'The highest mountain above sea level.',
              answer: 'What is Everest?',
              dailyDouble: false,
            },
            { clue: 'The largest ocean.', answer: 'What is the Pacific?', dailyDouble: false },
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
              clue: 'Each side starts this game with a king, a queen and eight pawns.',
              answer: 'What is chess?',
              dailyDouble: false,
            },
            {
              clue: 'The Filipino board game of sowing shells or stones along rows of holes.',
              answer: 'What is sungka?',
              dailyDouble: false,
            },
            {
              clue: 'The tile game from China with suits of bamboo, characters and dots.',
              answer: 'What is mahjong?',
              dailyDouble: false,
            },
            {
              clue: 'The three-player Filipino rummy-style card game.',
              answer: 'What is tong-its?',
              dailyDouble: true,
            },
            {
              clue: 'In 2016, a DeepMind program beat Lee Sedol at this ancient board game of black and white stones.',
              answer: 'What is Go?',
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
              clue: 'Donsol in Sorsogon is famous for these gentle giants, locally called butanding.',
              answer: 'What are whale sharks?',
              dailyDouble: false,
            },
            {
              clue: 'This sea creature is about 95% water and has no brain, heart or bones.',
              answer: 'What is a jellyfish?',
              dailyDouble: false,
            },
            {
              clue: 'This UNESCO-listed reef lies in the middle of the Sulu Sea, off Palawan.',
              answer: 'What is Tubbataha?',
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
              clue: 'The Tagalog name for the nine Masses held before dawn from December 16 to 24.',
              answer: 'What is Simbang Gabi?',
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
              clue: 'The Filipino name for the early November days spent visiting family graves.',
              answer: 'What is Undas?',
              dailyDouble: false,
            },
            {
              clue: 'The January festival of Kalibo, Aklan, honoring the Santo Niño.',
              answer: 'What is Ati-Atihan?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Pinoy Superheroes',
          clues: [
            {
              clue: 'Narda swallows a magic stone and shouts this name to transform.',
              answer: 'Who is Darna?',
              dailyDouble: false,
            },
            {
              clue: 'Weakling Tenteng lifts an enchanted weight to become this Mars Ravelo strongman.',
              answer: 'Who is Captain Barbell?',
              dailyDouble: false,
            },
            {
              clue: 'The Mars Ravelo hero whose body stretches like rubber.',
              answer: 'Who is Lastikman?',
              dailyDouble: false,
            },
            {
              clue: 'The Manila supernatural detective from Budjette Tan and Kajo Baldisimo’s komiks, adapted by Netflix in 2021.',
              answer: 'Who is Alexandra Trese?',
              dailyDouble: false,
            },
            {
              clue: 'In Carlo Vergara’s komiks, the beautician Ada swallows a mysterious stone and becomes this superheroine.',
              answer: 'Who is Zsazsa Zaturnnah?',
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
