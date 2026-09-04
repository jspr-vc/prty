import type { JeopardyPack } from '@workspace/game-jeopardy'

export const devTriviaPack: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'Version Control',
          clues: [
            {
              clue: 'The area between the working tree and the repository that git add writes into.',
              answer: 'What is the index, or staging area?',
              dailyDouble: false,
            },
            {
              clue: 'It rewrites history by replaying commits on a new base.',
              answer: 'What is rebase?',
              dailyDouble: false,
            },
            {
              clue: 'Git named its default branch this until 2020.',
              answer: 'What is master?',
              dailyDouble: true,
            },
            {
              clue: 'The plumbing command that writes a tree object from the index.',
              answer: 'What is git write-tree?',
              dailyDouble: false,
            },
            {
              clue: 'The proprietary system the Linux kernel used until a licence dispute in 2005 pushed Linus to write git.',
              answer: 'What is BitKeeper?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'HTTP Status Codes',
          clues: [
            {
              clue: 'The status returned when everything is fine.',
              answer: 'What is 200?',
              dailyDouble: false,
            },
            {
              clue: 'We do not know who you are; send credentials.',
              answer: 'What is 401?',
              dailyDouble: false,
            },
            {
              clue: 'We know who you are, and you still cannot.',
              answer: 'What is 403?',
              dailyDouble: false,
            },
            { clue: 'The teapot one.', answer: 'What is 418?', dailyDouble: false },
            {
              clue: 'The gateway upstream took too long.',
              answer: 'What is 504?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Languages',
          clues: [
            {
              clue: 'Created by Brendan Eich in ten days in 1995.',
              answer: 'What is JavaScript?',
              dailyDouble: false,
            },
            { clue: 'Its mascot is a gopher.', answer: 'What is Go?', dailyDouble: false },
            {
              clue: 'Named after a British comedy troupe.',
              answer: 'What is Python?',
              dailyDouble: false,
            },
            {
              clue: 'Its borrow checker enforces memory safety without a GC.',
              answer: 'What is Rust?',
              dailyDouble: false,
            },
            {
              clue: 'This 1958 language gave us the S-expression.',
              answer: 'What is Lisp?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Databases',
          clues: [
            {
              clue: 'The isolation level Postgres uses by default.',
              answer: 'What is read committed?',
              dailyDouble: false,
            },
            {
              clue: 'A transaction is atomic, consistent, isolated and this, the D in ACID.',
              answer: 'What is durable?',
              dailyDouble: false,
            },
            {
              clue: 'The Postgres index type whose name expands to Generalized Inverted Index.',
              answer: 'What is GIN?',
              dailyDouble: false,
            },
            {
              clue: 'Consistency, availability, partition tolerance: pick two.',
              answer: 'What is the CAP theorem?',
              dailyDouble: false,
            },
            {
              clue: 'The Postgres process that reclaims dead tuples.',
              answer: 'What is autovacuum?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Ops',
          clues: [
            {
              clue: 'The container orchestrator whose name is Greek for helmsman.',
              answer: 'What is Kubernetes?',
              dailyDouble: false,
            },
            {
              clue: 'The signal a graceful shutdown listens for.',
              answer: 'What is SIGTERM?',
              dailyDouble: false,
            },
            { clue: 'The default port for SSH.', answer: 'What is 22?', dailyDouble: false },
            {
              clue: 'The Terraform command that shows what would change without changing anything.',
              answer: 'What is plan?',
              dailyDouble: true,
            },
            {
              clue: 'The DNS record that maps a name to an IPv6 address.',
              answer: 'What is AAAA?',
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
          name: 'Algorithms',
          clues: [
            {
              clue: 'The average time complexity of quicksort.',
              answer: 'What is n log n?',
              dailyDouble: false,
            },
            {
              clue: 'The shortest-path algorithm that cannot handle negative edges.',
              answer: "What is Dijkstra's?",
              dailyDouble: false,
            },
            {
              clue: 'Two pointers moving at different speeds detect this.',
              answer: 'What is a cycle?',
              dailyDouble: false,
            },
            {
              clue: 'The data structure behind an LRU cache, besides a hash map.',
              answer: 'What is a doubly linked list?',
              dailyDouble: true,
            },
            {
              clue: 'This probabilistic structure answers "definitely not" or "maybe".',
              answer: 'What is a Bloom filter?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'The Web',
          clues: [
            {
              clue: 'The mechanism by which an Access-Control-Allow-Origin header lets a page read a cross-origin response.',
              answer: 'What is CORS?',
              dailyDouble: false,
            },
            {
              clue: 'The tree a browser builds from HTML, and the one JavaScript edits to change the page.',
              answer: 'What is the DOM?',
              dailyDouble: false,
            },
            {
              clue: 'The cookie flag that hides it from JavaScript.',
              answer: 'What is HttpOnly?',
              dailyDouble: false,
            },
            {
              clue: 'HTTP/2 replaced text framing with this.',
              answer: 'What is binary framing?',
              dailyDouble: false,
            },
            {
              clue: 'The spec that lets a page run near-native compiled code.',
              answer: 'What is WebAssembly?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Acronyms',
          clues: [
            { clue: 'YAGNI.', answer: "What is you aren't gonna need it?", dailyDouble: false },
            { clue: 'CRUD.', answer: 'What is create, read, update, delete?', dailyDouble: false },
            { clue: 'JWT.', answer: 'What is JSON Web Token?', dailyDouble: false },
            {
              clue: 'SOLID’s L.',
              answer: 'What is the Liskov substitution principle?',
              dailyDouble: false,
            },
            { clue: 'SRE.', answer: 'What is site reliability engineering?', dailyDouble: false },
          ],
        },
        {
          name: 'Bugs & Outages',
          clues: [
            {
              clue: 'The 2016 npm unpublish that broke the internet.',
              answer: 'What is left-pad?',
              dailyDouble: false,
            },
            {
              clue: 'The 2014 OpenSSL bug that leaked memory.',
              answer: 'What is Heartbleed?',
              dailyDouble: false,
            },
            {
              clue: 'The 2021 Log4j remote code execution flaw.',
              answer: 'What is Log4Shell?',
              dailyDouble: false,
            },
            {
              clue: 'The year 32-bit Unix time overflows.',
              answer: 'What is 2038?',
              dailyDouble: false,
            },
            {
              clue: 'The 1996 rocket lost to an unhandled float-to-int conversion.',
              answer: 'What is Ariane 5?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Editors',
          clues: [
            {
              clue: 'The keystroke that writes and quits vim.',
              answer: 'What is :wq?',
              dailyDouble: false,
            },
            {
              clue: "The modifier key whose overuse in Emacs is blamed for 'Emacs pinky'.",
              answer: 'What is Control?',
              dailyDouble: false,
            },
            {
              clue: 'VS Code is built on this desktop runtime.',
              answer: 'What is Electron?',
              dailyDouble: false,
            },
            {
              clue: 'The 1976 line editor that vi began life as the visual mode of.',
              answer: 'What is ex?',
              dailyDouble: false,
            },
            {
              clue: 'The language server protocol was introduced by this company.',
              answer: 'What is Microsoft?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'Computing History',
    clue: 'In 1947 operators at Harvard taped this to a logbook page, coining a term programmers still use.',
    answer: 'What is a moth (the first computer bug)?',
  },
}
