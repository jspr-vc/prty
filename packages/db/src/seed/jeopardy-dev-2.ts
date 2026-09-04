import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * A second developer board, so a room can run two without repeating. Categories
 * deliberately miss the first pack: no git, status codes, databases or editors.
 */
export const devTriviaPack2: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'Regular Expressions',
          clues: [
            {
              clue: 'The character that matches any single character except a newline.',
              answer: 'What is the dot?',
              dailyDouble: false,
            },
            {
              clue: 'This anchor matches the start of a line.',
              answer: 'What is the caret?',
              dailyDouble: false,
            },
            {
              clue: 'The quantifier meaning zero or more, named after the logician Kleene.',
              answer: 'What is the star?',
              dailyDouble: false,
            },
            {
              clue: 'Appending this character to a quantifier makes it lazy instead of greedy.',
              answer: 'What is the question mark?',
              dailyDouble: false,
            },
            {
              clue: 'The zero-width position that \\b matches.',
              answer: 'What is a word boundary?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Data Formats',
          clues: [
            {
              clue: 'Douglas Crockford popularised this text format born from JavaScript object literals.',
              answer: 'What is JSON?',
              dailyDouble: false,
            },
            {
              clue: "The indentation-sensitive format whose name is the recursive acronym 'YAML Ain't Markup Language'.",
              answer: 'What is YAML?',
              dailyDouble: false,
            },
            {
              clue: "Google's binary serialisation format, defined in .proto files.",
              answer: 'What are Protocol Buffers?',
              dailyDouble: false,
            },
            {
              clue: 'Every element must be closed in this verbose format, which gave the world SOAP.',
              answer: 'What is XML?',
              dailyDouble: true,
            },
            {
              clue: "The 'T' in TOML is the first name of its author, a GitHub co-founder.",
              answer: 'Who is Tom (Preston-Werner)?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Design Patterns',
          clues: [
            {
              clue: 'The pattern that guarantees a class has exactly one instance.',
              answer: 'What is a singleton?',
              dailyDouble: false,
            },
            {
              clue: 'This pattern lets subscribers be notified when a subject changes.',
              answer: 'What is observer?',
              dailyDouble: false,
            },
            {
              clue: 'This pattern wraps an object to give it new behaviour without subclassing it.',
              answer: 'What is decorator?',
              dailyDouble: false,
            },
            {
              clue: 'The pattern that converts one interface into the one a client expects, like a travel plug.',
              answer: 'What is adapter?',
              dailyDouble: false,
            },
            {
              clue: 'The Gang of Four book that catalogued 23 patterns was published in this year.',
              answer: 'What is 1994?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Testing',
          clues: [
            {
              clue: 'The colour a test suite is said to be when everything passes.',
              answer: 'What is green?',
              dailyDouble: false,
            },
            {
              clue: 'The three-letter practice of writing the test before the code.',
              answer: 'What is TDD?',
              dailyDouble: false,
            },
            {
              clue: 'A stand-in object that records how it was called, so a test can assert on it.',
              answer: 'What is a mock, or a spy?',
              dailyDouble: false,
            },
            {
              clue: 'Testing that feeds a program random or malformed input to find crashes.',
              answer: 'What is fuzzing?',
              dailyDouble: false,
            },
            {
              clue: 'Testing that states a property for all inputs and generates the inputs itself, as QuickCheck does.',
              answer: 'What is property-based testing?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Package Managers',
          clues: [
            {
              clue: 'The package manager that ships with Node.js.',
              answer: 'What is npm?',
              dailyDouble: false,
            },
            {
              clue: "Python's package installer, a three-letter command.",
              answer: 'What is pip?',
              dailyDouble: false,
            },
            {
              clue: "Rust's build tool and package manager.",
              answer: 'What is Cargo?',
              dailyDouble: false,
            },
            {
              clue: 'The registry Ruby libraries are published to, as .gem files.',
              answer: 'What is RubyGems?',
              dailyDouble: false,
            },
            {
              clue: "The macOS package manager whose packages are called formulae and whose command is 'brew'.",
              answer: 'What is Homebrew?',
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
          name: 'Type Systems',
          clues: [
            {
              clue: 'TypeScript compiles to this language.',
              answer: 'What is JavaScript?',
              dailyDouble: false,
            },
            {
              clue: 'Typing checked at compile time rather than at run time.',
              answer: 'What is static typing?',
              dailyDouble: false,
            },
            {
              clue: 'Judging an object by what it can do rather than by its declared class, named after a bird.',
              answer: 'What is duck typing?',
              dailyDouble: false,
            },
            {
              clue: "The type with no values at all, spelled 'never' in TypeScript.",
              answer: 'What is the bottom type?',
              dailyDouble: false,
            },
            {
              clue: 'The type-inference algorithm behind ML and Haskell, named after two people.',
              answer: 'What is Hindley-Milner?',
              dailyDouble: true,
            },
          ],
        },
        {
          name: 'Concurrency',
          clues: [
            {
              clue: 'Two threads each waiting on the other, forever.',
              answer: 'What is a deadlock?',
              dailyDouble: false,
            },
            {
              clue: "The lock that admits one thread at a time, short for 'mutual exclusion'.",
              answer: 'What is a mutex?',
              dailyDouble: false,
            },
            {
              clue: "Go's lightweight threads, multiplexed onto OS threads by the runtime.",
              answer: 'What are goroutines?',
              dailyDouble: false,
            },
            {
              clue: 'Erlang and Akka build concurrency on these, which share nothing and talk by message.',
              answer: 'What are actors?',
              dailyDouble: false,
            },
            {
              clue: "Python's global lock that lets only one thread run bytecode at a time, three letters.",
              answer: 'What is the GIL?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Famous Programmers',
          clues: [
            {
              clue: "She wrote what is considered the first computer program, for Babbage's Analytical Engine.",
              answer: 'Who is Ada Lovelace?',
              dailyDouble: false,
            },
            {
              clue: 'He created Linux, and later git.',
              answer: 'Who is Linus Torvalds?',
              dailyDouble: false,
            },
            {
              clue: "Bjarne Stroustrup created this language as 'C with Classes'.",
              answer: 'What is C++?',
              dailyDouble: false,
            },
            {
              clue: "She built A-0, the first compiler, and popularised the word 'debugging'.",
              answer: 'Who is Grace Hopper?',
              dailyDouble: false,
            },
            {
              clue: "Co-author of 'The C Programming Language', he also built Unix with Ken Thompson.",
              answer: 'Who is Dennis Ritchie?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Command Line',
          clues: [
            {
              clue: 'The command that prints its arguments to standard output.',
              answer: 'What is echo?',
              dailyDouble: false,
            },
            {
              clue: 'The command that searches files for lines matching a pattern, named after an ed command.',
              answer: 'What is grep?',
              dailyDouble: false,
            },
            {
              clue: 'This command shows the last lines of a file, and with -f keeps following it.',
              answer: 'What is tail?',
              dailyDouble: false,
            },
            {
              clue: "The stream editor whose most typed line is 's/old/new/'.",
              answer: 'What is sed?',
              dailyDouble: false,
            },
            {
              clue: 'The file descriptor number of standard error.',
              answer: 'What is 2?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Cryptography',
          clues: [
            {
              clue: 'The hash family whose 256-bit member secures Bitcoin blocks.',
              answer: 'What is SHA-2, or SHA-256?',
              dailyDouble: false,
            },
            {
              clue: 'The public-key algorithm named after Rivest, Shamir and Adleman.',
              answer: 'What is RSA?',
              dailyDouble: false,
            },
            {
              clue: 'Random data added to a password before hashing so equal passwords hash differently.',
              answer: 'What is a salt?',
              dailyDouble: false,
            },
            {
              clue: 'The symmetric cipher NIST chose in 2001 to replace DES.',
              answer: 'What is AES?',
              dailyDouble: false,
            },
            {
              clue: 'The 1976 protocol, named after its two authors, that lets strangers agree a secret over a public channel.',
              answer: 'What is Diffie-Hellman?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'Programming Languages',
    clue: 'Designed in 1959 and still running banks, its name is short for Common Business-Oriented Language.',
    answer: 'What is COBOL?',
  },
}
