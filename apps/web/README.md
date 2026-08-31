# web

One Next.js app serving three surfaces from a single deployment and a single
origin:

| Path                   | Surface        |
| ---------------------- | -------------- |
| `/`, `/s/:code`        | The big screen |
| `/join/:code`          | Player phones  |
| `/host`, `/host/:code` | Host console   |

Each is a route group with its own root layout, because the TV, the phone and
the console want different chrome.

Being same-origin is the point: the QR code the room scans is a relative path
resolved from the request, so there is no URL to configure anywhere and nothing
to rebuild when the domain changes.
