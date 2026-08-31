# web

One Next.js app serving three surfaces from a single deployment:

| Path            | Surface        | Host in production |
| --------------- | -------------- | ------------------ |
| `/`, `/s/:code` | The big screen | `prty.jspr.vc`     |
| `/join/:code`   | Player phones  | `prty.jspr.vc`     |
| `/host*`        | Host console   | `prty-gm.jspr.vc`  |

Each surface is a route group with its own root layout, because the TV, the
phone and the console want different chrome.

Both domains point at this one project, so every path is reachable from either.
The only routing is a Vercel redirect in `vercel.json` sending `/` on the
console host to `/host`; it is declared there rather than in Next middleware
because middleware runs on the edge runtime, which does not see server
environment variables.

Keeping the join page on the TV host is deliberate: the QR code the room scans
is then a same-origin path, with no cross-origin URL to configure or rebuild.
