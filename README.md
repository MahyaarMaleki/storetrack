# StoreTrack

## Prerequisites

- **Node.js**: Make sure you have the latest LTS version installed.
- **npm** or **yarn** or **pnpm** or **bun**: The package manager of your choice.

## Clone the Repository

First, clone the project repository from GitHub to your local machine:

```bash
git clone https://github.com/MahyaarMaleki/storetrack.git
cd storetrack
```

## Install Dependencies

Install the project's dependencies using your preferred package manager:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## Create the Environment File

Create a new file named .env in the root of your project and add the following line. This tells Drizzle where to create the local database file.

`DATABASE_URL="file:./db/sqlite.db"`

You also need to set the env var `JWT_SECRET`

## Database Setup

This project uses a local SQLite database managed by Drizzle ORM. You need to create the database file and apply the schema migrations.
For this, I have created a custom script, for example using **pnpm**:

```bash
pnpm run dev:db
```

## Run the Development Server

You are now ready to start the Next.js development server.

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sample Screenshots of some pages

