import type { JeopardyPack } from '@workspace/game-jeopardy'

/** No specialist knowledge assumed — the pack to reach for with mixed company. */
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
              clue: 'This city is home to the Colosseum.',
              answer: 'What is Rome?',
              dailyDouble: false,
            },
            {
              clue: 'The only continent with no permanent residents.',
              answer: 'What is Antarctica?',
              dailyDouble: false,
            },
            {
              clue: 'This African river is the longest in the world.',
              answer: 'What is the Nile?',
              dailyDouble: false,
            },
            {
              clue: 'Country made up of more than 17,000 islands.',
              answer: 'What is Indonesia?',
              dailyDouble: true,
            },
            {
              clue: 'The strait separating Europe from Africa at its narrowest.',
              answer: 'What is the Strait of Gibraltar?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'At The Movies',
          clues: [
            {
              clue: 'The lion cub who could not wait to be king.',
              answer: 'What is The Lion King?',
              dailyDouble: false,
            },
            {
              clue: 'A ship hits an iceberg; Jack draws Rose.',
              answer: 'What is Titanic?',
              dailyDouble: false,
            },
            {
              clue: 'Its sequel was subtitled "Judgment Day".',
              answer: 'What is The Terminator?',
              dailyDouble: false,
            },
            {
              clue: 'Director of Jaws, E.T. and Jurassic Park.',
              answer: 'Who is Steven Spielberg?',
              dailyDouble: false,
            },
            {
              clue: 'The first film to win Best Picture at the Oscars, in 1929.',
              answer: 'What is Wings?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Something To Eat',
          clues: [
            {
              clue: 'The spice that gives curry its yellow colour.',
              answer: 'What is turmeric?',
              dailyDouble: false,
            },
            {
              clue: 'A margherita pizza is topped with tomato, basil and this cheese.',
              answer: 'What is mozzarella?',
              dailyDouble: false,
            },
            {
              clue: "This Italian coffee-and-mascarpone dessert's name means 'pick me up'.",
              answer: 'What is tiramisu?',
              dailyDouble: false,
            },
            {
              clue: 'Sushi rice is seasoned with sugar, salt and this.',
              answer: 'What is rice vinegar?',
              dailyDouble: false,
            },
            {
              clue: 'The country that gave us pad thai.',
              answer: 'What is Thailand?',
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
              clue: 'A group of these birds is called a murder.',
              answer: 'What are crows?',
              dailyDouble: false,
            },
            {
              clue: 'This mammal is the only one that can truly fly.',
              answer: 'What is a bat?',
              dailyDouble: false,
            },
            {
              clue: 'An octopus has this many hearts.',
              answer: 'What is three?',
              dailyDouble: false,
            },
            {
              clue: 'The largest animal that has ever lived.',
              answer: 'What is the blue whale?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Turn It Up',
          clues: [
            {
              clue: 'The Fab Four from Liverpool.',
              answer: 'Who are The Beatles?',
              dailyDouble: false,
            },
            {
              clue: 'A standard piano has this many keys.',
              answer: 'What is 88?',
              dailyDouble: false,
            },
            {
              clue: 'She sang "Rolling in the Deep".',
              answer: 'Who is Adele?',
              dailyDouble: false,
            },
            {
              clue: 'This composer kept writing after going deaf.',
              answer: 'Who is Beethoven?',
              dailyDouble: false,
            },
            {
              clue: 'The instrument played by a timpanist.',
              answer: 'What are kettledrums?',
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
              clue: 'The wall that divided this city fell in 1989.',
              answer: 'What is Berlin?',
              dailyDouble: false,
            },
            {
              clue: 'The ship that carried the Pilgrims in 1620.',
              answer: 'What is the Mayflower?',
              dailyDouble: false,
            },
            {
              clue: 'She was the last active pharaoh of Egypt.',
              answer: 'Who is Cleopatra?',
              dailyDouble: false,
            },
            {
              clue: 'The year the first human walked on the Moon.',
              answer: 'What is 1969?',
              dailyDouble: true,
            },
            {
              clue: 'This empire was ruled from Constantinople for a thousand years.',
              answer: 'What is the Byzantine Empire?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Good Sport',
          clues: [
            {
              clue: 'The number of players on a football pitch per side.',
              answer: 'What is eleven?',
              dailyDouble: false,
            },
            {
              clue: 'This event happens every four years and has five rings.',
              answer: 'What are the Olympics?',
              dailyDouble: false,
            },
            { clue: 'In tennis, a score of zero.', answer: 'What is love?', dailyDouble: false },
            {
              clue: 'The country that has won the most FIFA World Cups.',
              answer: 'What is Brazil?',
              dailyDouble: false,
            },
            {
              clue: 'A hole in one on a par five is called this.',
              answer: 'What is a condor?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Off The Shelf',
          clues: [
            {
              clue: 'The boy wizard with a lightning scar.',
              answer: 'Who is Harry Potter?',
              dailyDouble: false,
            },
            {
              clue: 'He wrote Romeo and Juliet.',
              answer: 'Who is Shakespeare?',
              dailyDouble: false,
            },
            {
              clue: 'This novel opens "Call me Ishmael."',
              answer: 'What is Moby-Dick?',
              dailyDouble: false,
            },
            {
              clue: 'The detective who lived at 221B Baker Street.',
              answer: 'Who is Sherlock Holmes?',
              dailyDouble: false,
            },
            {
              clue: 'She wrote Pride and Prejudice.',
              answer: 'Who is Jane Austen?',
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
              clue: 'The planet closest to the Sun.',
              answer: 'What is Mercury?',
              dailyDouble: false,
            },
            {
              clue: 'The force that keeps us on the ground.',
              answer: 'What is gravity?',
              dailyDouble: false,
            },
            {
              clue: 'Human blood is red because of this iron-carrying protein.',
              answer: 'What is haemoglobin?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Around The House',
          clues: [
            {
              clue: 'The appliance that keeps food cold.',
              answer: 'What is a refrigerator?',
              dailyDouble: false,
            },
            {
              clue: 'You use this to get creases out of a shirt.',
              answer: 'What is an iron?',
              dailyDouble: false,
            },
            {
              clue: 'This room usually contains a bath and a basin.',
              answer: 'What is a bathroom?',
              dailyDouble: false,
            },
            {
              clue: 'The tool with a claw on one end for pulling nails.',
              answer: 'What is a hammer?',
              dailyDouble: false,
            },
            {
              clue: 'The three prongs of a UK plug carry live, neutral and this.',
              answer: 'What is earth?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'World Landmarks',
    clue: 'Completed in 1889 as a temporary exhibit, this tower was nearly torn down twenty years later.',
    answer: 'What is the Eiffel Tower?',
  },
}
