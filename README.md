![Tempus](./public/logos/tempuslogofull.svg)

A simple, self-hostable weekly timetable app. Whether you're a student keeping track of classes, a parent managing your kid's school schedule, or a teacher organising your week, Tempus gives you a clean visual view of your time.

---

## Features

- **Dashboard** - see what's happening right now, whether you're on a break, or what's coming up next
- **Weekly timetable grid** - a full week-at-a-glance view with blocks laid out by time
- **Add & delete blocks** - fill in a subject, location, start time, and end time for any slot
- **Customisable view** - set your own timetable start and end time, and days of the week in Settings so the grid only shows the hours and days that matter to you
- **Dark mode** - easy on the eyes, day or night
- **Per-user accounts** - each user has their own private timetable
- **Fully self-hostable** - runs in Docker with a PostgreSQL database

---

## 📸 Screenshots

### Dashboard

![Dashboard](./public/screenshots/dashboard.png)

> See what's on right now, whether you're on a break, and what's coming up next, with a live clock.

### Timetable

![Timetable](./public/screenshots/timetable.png)

> Your whole week at a glance. Today's column is highlighted so you always know where you are.

### Adding a Block

![Add Block](./public/screenshots/add-block.png)

> Add a new class or event with a subject, location, and time. Simple form, no fuss.

### Settings

![Settings](./public/screenshots/settings.png)

> Set your timetable's start & end time and days of the week so the grid fits your actual week.

---

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) (App Router)        |
| Language   | TypeScript                                        |
| Database   | PostgreSQL                                        |
| Auth       | [Auth.js (NextAuth)](https://authjs.dev)          |
| UI         | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS |
| Deployment | Docker + Docker Compose                           |

---

## Self-Hosting with Docker

> [!CAUTION]
> This app is not yet at version 1.0.0 and is in active development. As such, there may be breaking changes, please read release notes for any warnings and always make a backup before updating.

An `example-compose.yaml` is included to get you up and running.

**1. Copy the example config**

```bash
cp example-compose.yaml compose.yaml
```

**2. Fill in your environment variables**

Open `compose.yaml` and set the following:

```yaml
NODE_ENV: production
POSTGRES_USER: timetable # Replace this with your user
POSTGRES_PASSWORD: timetable # Replace this with your user password
POSTGRES_DB: timetable
POSTGRES_PORT: 5432
POSTGRES_HOST: timetable_db
AUTH_SECRET: # Run: openssl rand -base64 32
AUTH_ON: true # Change to false to remove auth, single user only
AUTH_TRUST_HOST: true
APPROVE_SIGNUPS: false # Change to true to stop auto-approving new user sign-ups. Not recommended, see note below.
```

_Note - if you disable auto-approving new user sign-ups, you will currently have to approve users in the database itself manually. Change the "account_enabled" field to true in the users table for the relevant user. This will be addressed in a future release_

**3. Start the app**

```bash
docker compose up -d --build
```

> The database schema is set up automatically as part of the Docker build, no manual SQL required.

**4. Open the app**

Visit [http://localhost:3000](http://localhost:3000) and create your account.

---

## Development Setup

**Prerequisites:** Node.js, pnpm, PostgreSQL

**1. Clone the repo**

```bash
git clone https://github.com/ASam08/timetable-app.git
cd timetable-app
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Set up environment variables**

Create a `.env.local` file in the root:

```env
AUTH_SECRET=your_secret_here
DATABASE_URL=postgresql://user:password@localhost:5432/timetable
AUTH_ON="true" # Set to 'true' to enable authentication
```

**4. Start the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and you're good to go.

---

## License

[Apache 2.0](./LICENSE.md)
