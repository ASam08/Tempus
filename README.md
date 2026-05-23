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
- **Admin Management** - for managing user access
- **Fully self-hostable** - runs in Docker with a PostgreSQL database

---

## Screenshots

### Dashboard

![Dashboard](./public/screenshots/dashboard.png)

> See what's on right now, whether you're on a break, and what's coming up next, with a live clock.

### Timetable

![Timetable](./public/screenshots/timetable.png)

> Your whole week at a glance. Today's column is highlighted so you always know where you are.

### Adding a Block

![Add Block](./public/screenshots/add-block.png)

> Add a new class or event with a subject, location, and time.

### Settings

![Settings](./public/screenshots/settings.png)

> Set your timetable's start & end time and days of the week so the grid fits your actual week.

### Admin User Management

![Admin](./public/screenshots/admin.png)

> Manage users access under the admin user management page.

---

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) (App Router)        |
| Language   | TypeScript                                        |
| Database   | PostgreSQL                                        |
| ORM        | [Drizzle](https://orm.drizzle.team/)              |
| Auth       | [Better-Auth](https://better-auth.com)            |
| UI         | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS |
| Deployment | Docker + Docker Compose                           |

---

## Self-Hosting with Docker

> [!CAUTION]
> This app is not yet at version 1.0.0 and is in active development. As such, there may be breaking changes, please read release notes for any warnings and always make a backup before updating.

An `example-compose.yaml` is included to get you up and running.

**1. Copy the example config**

Create a compose.yaml file in your project folder, using the below template

```yaml
services:
  tempus_web:
    image: ghcr.io/asam08/tempus:latest
    container_name: tempus_web
    ports:
      - "3000:3000"
    depends_on:
      - tempus_db
    environment:
      NODE_ENV: production
      POSTGRES_USER: tempus # Replace this with your user
      POSTGRES_PASSWORD: tempus # Replace this with your user password
      POSTGRES_DB: tempus
      POSTGRES_PORT: 5432
      POSTGRES_HOST: tempus_db
      BETTER_AUTH_SECRET: # Run: openssl rand -base64 32
      TEMPUS_URL: # set to your applications URL
    restart: unless-stopped

  tempus_db:
    image: postgres:16-alpine
    container_name: tempus_db
    environment:
      POSTGRES_USER: tempus # Replace this with your user
      POSTGRES_PASSWORD: tempus # Replace this with your user password
      POSTGRES_DB: tempus
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

**2. Fill in your environment variables**

Open `compose.yaml` and adjust the environment variables. See [the enviornment variables](#environment-variables) section for more details.

Please remember to change the password from "Tempus".

**3. Start the app**

```bash
docker compose up -d
```

> The database schema is set up automatically as part of the Docker build.

**4. Open the app**

Visit [http://localhost:3000](http://localhost:3000) and create your account.

---

## Environment Variables

The following environment variables are available:

| Variable             | Required? | Default | Notes                                                                |
| -------------------- | --------- | ------- | -------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET` | Yes       | -       | Run `openssl rand -base64 32` to generate                            |
| `TEMPUS_URL`         | Yes       | -       | Set to your app's base URL, e.g. `http://localhost:3000`             |
| `NODE_ENV`           | Yes       | -       | set to true to ensure proper performance                             |
| `APPROVE_SIGNUPS`    | No        | `false` | Set to `true` to require admin approval before new users can sign in |

---

## Development Setup

**Prerequisites:** Node.js, pnpm, PostgreSQL

**1. Clone the repo**

```bash
git clone https://github.com/ASam08/tempus.git
cd tempus
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
```

**4. Start the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and you're good to go.

---

## License

[Apache 2.0](./LICENSE.md)
