import type { JeopardyPack } from '@workspace/game-jeopardy'

/** No specialist knowledge assumed. Written for a Filipino room with global general knowledge. */
export const generalTriviaPack: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'On The Map',
          clues: [
            {
              clue: 'The largest island in the Philippines.',
              answer: 'What is Luzon?',
              dailyDouble: false,
            },
            {
              clue: 'The only continent with no permanent residents.',
              answer: 'What is Antarctica?',
              dailyDouble: false,
            },
            {
              clue: 'This Bicol province is home to the near-perfect cone of Mayon Volcano.',
              answer: 'What is Albay?',
              dailyDouble: false,
            },
            {
              clue: 'Country made up of more than 17,000 islands, just south of the Philippines.',
              answer: 'What is Indonesia?',
              dailyDouble: true,
            },
            {
              clue: 'This strait between Samar and Leyte shares its name with the bridge that spans it.',
              answer: 'What is the San Juanico Strait?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'At The Movies',
          clues: [
            {
              clue: 'The lion cub who could not wait to be king.',
              answer: 'Who is Simba?',
              dailyDouble: false,
            },
            {
              clue: 'A ship hits an iceberg; Jack draws Rose.',
              answer: 'What is Titanic?',
              dailyDouble: false,
            },
            {
              clue: 'The 2019 South Korean film that became the first non-English-language Best Picture winner at the Oscars.',
              answer: 'What is Parasite?',
              dailyDouble: false,
            },
            {
              clue: 'The Japanese director of Spirited Away and My Neighbor Totoro.',
              answer: 'Who is Hayao Miyazaki?',
              dailyDouble: false,
            },
            {
              clue: 'Nora Aunor plays Elsa, a faith healer, in this 1982 Ishmael Bernal classic.',
              answer: 'What is Himala?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Something To Eat',
          clues: [
            {
              clue: 'Filipino dish of meat braised in vinegar, soy sauce, garlic and bay leaf.',
              answer: 'What is adobo?',
              dailyDouble: false,
            },
            {
              clue: 'The fertilized duck egg sold by street vendors at night.',
              answer: 'What is balut?',
              dailyDouble: false,
            },
            {
              clue: 'The spice that gives curry its yellow color.',
              answer: 'What is turmeric?',
              dailyDouble: false,
            },
            {
              clue: 'This sizzling Kapampangan dish is made from chopped pork face and liver.',
              answer: 'What is sisig?',
              dailyDouble: false,
            },
            {
              clue: 'This Bicolano dish cooks dried taro leaves in coconut milk.',
              answer: 'What is laing?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Creature Feature',
          clues: [
            {
              clue: 'The fastest land animal.',
              answer: 'What is the cheetah?',
              dailyDouble: false,
            },
            {
              clue: 'The water buffalo known as the Filipino farmer’s best friend.',
              answer: 'What is the carabao?',
              dailyDouble: false,
            },
            {
              clue: 'Once called the monkey-eating eagle, it is the national bird of the Philippines.',
              answer: 'What is the Philippine eagle?',
              dailyDouble: false,
            },
            {
              clue: 'An octopus has this many hearts.',
              answer: 'What is three?',
              dailyDouble: false,
            },
            {
              clue: 'This small wild buffalo is found only on the island of Mindoro.',
              answer: 'What is the tamaraw?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Turn It Up',
          clues: [
            {
              clue: 'The K-pop group of RM, Jin, Suga, J-Hope, Jimin, V and Jungkook.',
              answer: 'Who are BTS?',
              dailyDouble: false,
            },
            {
              clue: 'A standard piano has this many keys.',
              answer: 'What is 88?',
              dailyDouble: false,
            },
            {
              clue: 'The P-pop girl group behind "Pantropiko" and "Salamin, Salamin".',
              answer: 'Who is BINI?',
              dailyDouble: false,
            },
            {
              clue: 'She won a Tony Award in 1991 for playing Kim in Miss Saigon.',
              answer: 'Who is Lea Salonga?',
              dailyDouble: false,
            },
            {
              clue: 'His song "Anak" became one of the best-selling Filipino records around the world.',
              answer: 'Who is Freddie Aguilar?',
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
          name: 'Back In Time',
          clues: [
            {
              clue: 'The Philippine national hero executed at Bagumbayan in 1896.',
              answer: 'Who is José Rizal?',
              dailyDouble: false,
            },
            {
              clue: 'The chieftain of Mactan whose warriors defeated Magellan in 1521.',
              answer: 'Who is Lapu-Lapu?',
              dailyDouble: false,
            },
            {
              clue: 'The peaceful 1986 uprising that ended the Marcos dictatorship.',
              answer: 'What is the EDSA People Power Revolution?',
              dailyDouble: false,
            },
            {
              clue: 'The year Philippine independence from Spain was declared in Kawit, Cavite.',
              answer: 'What is 1898?',
              dailyDouble: true,
            },
            {
              clue: 'This emperor of Mali was famed for the gold he gave away on his pilgrimage to Mecca.',
              answer: 'Who is Mansa Musa?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Good Sport',
          clues: [
            {
              clue: 'The number of players per side on a soccer field.',
              answer: 'What is eleven?',
              dailyDouble: false,
            },
            {
              clue: 'The only boxer to win world titles in eight weight divisions.',
              answer: 'Who is Manny Pacquiao?',
              dailyDouble: false,
            },
            {
              clue: 'This weightlifter won the first Olympic gold medal for the Philippines, at Tokyo 2020.',
              answer: 'Who is Hidilyn Diaz?',
              dailyDouble: false,
            },
            {
              clue: 'This Filipino gymnast won two gold medals at the Paris 2024 Olympics.',
              answer: 'Who is Carlos Yulo?',
              dailyDouble: false,
            },
            {
              clue: 'Played with a rattan ball and no hands, this sport’s name joins the Malay word for kick and the Thai word for ball.',
              answer: 'What is sepak takraw?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Off The Shelf',
          clues: [
            {
              clue: 'Rizal’s 1887 novel whose Latin title means "touch me not".',
              answer: 'What is Noli Me Tángere?',
              dailyDouble: false,
            },
            {
              clue: 'Rizal’s second novel, published in 1891.',
              answer: 'What is El Filibusterismo?',
              dailyDouble: false,
            },
            {
              clue: 'Francisco Balagtas wrote this awit set in the kingdom of Albania.',
              answer: 'What is Florante at Laura?',
              dailyDouble: false,
            },
            {
              clue: 'The Colombian author of One Hundred Years of Solitude.',
              answer: 'Who is Gabriel García Márquez?',
              dailyDouble: false,
            },
            {
              clue: 'The Japanese court lady who wrote The Tale of Genji.',
              answer: 'Who is Murasaki Shikibu?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'How Things Work',
          clues: [
            {
              clue: 'Water boils at this temperature in Celsius at sea level.',
              answer: 'What is 100?',
              dailyDouble: false,
            },
            {
              clue: 'The gas plants take in to make their food.',
              answer: 'What is carbon dioxide?',
              dailyDouble: false,
            },
            {
              clue: 'The hottest planet in the solar system, even though Mercury is closer to the Sun.',
              answer: 'What is Venus?',
              dailyDouble: false,
            },
            {
              clue: 'The SI unit of force.',
              answer: 'What is the newton?',
              dailyDouble: false,
            },
            {
              clue: 'Human blood is red because of this iron-carrying protein.',
              answer: 'What is hemoglobin?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Around The House',
          clues: [
            {
              clue: 'The plastic dipper found in nearly every Filipino bathroom.',
              answer: 'What is a tabo?',
              dailyDouble: false,
            },
            {
              clue: 'The rubber slippers you leave at the door.',
              answer: 'What are tsinelas?',
              dailyDouble: false,
            },
            {
              clue: 'The stiff outdoor broom made from coconut leaf midribs.',
              answer: 'What is a walis tingting?',
              dailyDouble: false,
            },
            {
              clue: 'The handwoven sleeping mat that Basey, Samar is famous for.',
              answer: 'What is a banig?',
              dailyDouble: false,
            },
            {
              clue: 'The reed that weavers in Basey, Samar dye and weave into their famous mats.',
              answer: 'What is tikog?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'Philippine Landmarks',
    clue: 'Carved by hand into the mountains of northern Luzon, these terraces were inscribed as a UNESCO World Heritage Site in 1995.',
    answer:
      'What are the Rice Terraces of the Philippine Cordilleras, or the Ifugao Rice Terraces?',
  },
}
