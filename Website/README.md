# Multilingual Hispanic Speech in California

Main corpus website for Multilingual Hispanic Speech in California research
group. Currently on <https://muhsic.acad.ucsc.edu>.

## Prerequisites

- [Bun.js](https://bun.sh) JavaScript runtime

## Download

Commands for download the code from GitHub.

```sh
# Note that cloning this way will not have the push permission
git clone https://github.com/julian-vargo/MuHSiC.git
cd MuHSiC/Website
```

Then, install libraries. (should only do this once)

```sh
bun i
```

## Environment Variables

Make sure that before developing or deploying, you must set up all environment
variables into `.env` file. `.env.example` provides a template on what
variables must be set.

- `BASE_URL`: the URL of this website to be placed at (only needed for
production).
- `NOCODB_URL`: the URL of NocoDB database site.
- `NOCODB_TOKEN`: generated token of NocoDB allowing access to the database,
**must be secret**.
- `NOCODB_TABLEID`: the table ID containing all participant's data.
- `AUTH_KEYCLOAK_ISSUER`: Keycloak's realm full url.
- `AUTH_SECRET`: randomly generated string, **must be secret**.
- `AUTH_KEYCLOAK_ID`: OIDC's allocated client ID for this website.
- `AUTH_KEYCLOAK_SECRET`: client secret of this OIDC's client, **must be
secret**.

## Development

The command to start the dev server. The dev website will be available at
<http://localhost:4321>.

```sh
bun --bun run dev
```

## Deployment

### Natively

To build a production-ready server, run the following command.

```sh
bun run build
```

If successful, all the website files will be in `dist` directory. You can copy
this to the server and deploy using the following command.

```sh
bun dist/server/entry.mjs
```

The server will be exposed on port `4321`.

### Docker

Requires Docker.

If you know what are you doing, the `Dockerfile` is already provided. When run,
the server is exposed on port `4321`.

TODO: provide docker commands and possibly docker-compose.yml for deployment.

## Brief guidelines

```
├── public                      # static assets
└── src
    ├── components              # aka partial HTML templates
    │   ├── Navbar.astro            # top navigation bar
    │   ├── People.astro            # format people name by sorting and joining commas
    │   ├── SafeEmail.astro         # format email to anti-scraping format
    │   ├── TOS.html                # terms and conditions
    │   └── logo                    # logo images
    ├── layouts                 # all the layouts
    │   └── Layout.astro            # the main layout (used by the entire site)
    ├── lib                     # server logics (not exposed to client)
    │   ├── auth.ts                 # definition of who can access the entire site
    │   └── nocodb.ts               # NocoDB API access helper functions
    └── pages                   # all pages
        ├── index.astro             # the first landing page
        ├── about
        │   ├── index.astro
        │   ├── overview.astro
        │   └── project-team.astro
        ├── corpus
        │   ├── index.astro         # list of all partipant
        │   └── [code].astro        # dynamically generated participant information page
        ├── img                     # images used in the site
        ├── material
        │   └── index.astro
        ├── cite-the-corpus.astro
        ├── links-to-other-corpora.astro
        └── profile
            └── index.astro
```

All the pages is structured in the `src/pages` directory. The brief [logic of
the result page url given the
filename/location](https://docs.astro.build/en/guides/routing/) is:

- `/index.astro` -> `/`
- `/about.astro` -> `/about`
- `/about/index.astro` -> `/about`
- `/about/overview.astro` -> `/about/overview`
- `/corpus/[code].astro` -> dynamically rendered depending on the given url.
For example, if I enter `/corpus/UCSC_NS1_1`, JS code will use the value
`UCSC_NS1_1` to determine what information to be shown.

There are 3 types of files:

- **Astro** (`.astro`): A mix of HTML and JavaScript. Usually contains
Javascript code on top and HTML on the bottom. The JS code will be run on the
server side, determining what to show on the client side. (Mostly determining
client's permission).
- **HTML** (`.html`): pretty straight forward. Use this if the snippet is
static and will not change depending on the client's condition.
- **TypeScript/JavaScript** (`.ts`/`.js`): A logic code.
