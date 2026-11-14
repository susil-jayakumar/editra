# EDITRA

A freelancing platform that connects companies with professional video, photo and content editors. Companies post editing jobs, editors build a profile and apply, and the whole job runs on the platform: hiring, delivery, revisions and completion.

**Live demo:** https://editraa.vercel.app

## How it works

| Role | What they do |
|---|---|
| **Editor** | Builds a profile (skills, software, experience, portfolio, resume, hourly rate, availability), browses open jobs, applies with a proposal, delivers work and handles revision requests |
| **Company** | Registers a company, waits for admin approval, posts jobs with a budget and reference images, reviews applicants, hires, and accepts a delivery or asks for a revision |
| **Admin** | Approves or rejects new companies and can deactivate one. Admin access comes from an allow-list of emails |

## Features

- **Sign-in with Clerk.** Clerk user events are synced into the database by Inngest background functions, with a fallback that creates the user on first visit.
- **Company approval.** New companies start as `PENDING`; only `APPROVED` and active companies can post jobs. Jobs from inactive companies are hidden from the board.
- **Job posting.** Reference images are uploaded to ImageKit. An **AI helper** (OpenAI `gpt-4o-mini`) drafts the job description.
- **Editor profiles.** Skills and software as lists, portfolio and social links, and a resume uploaded to ImageKit. A profile is required before applying.
- **One application per job.** Checked in the API and enforced by a unique constraint on `(jobId, editorId)`.
- **Job workflow.** `APPLIED → IN_REVIEW → HIRED → IN_PROGRESS → DELIVERED → COMPLETED`, with `REVISION` (with a revision note) sending work back to the editor, and `REJECTED` at the review stages. Editors can attach a delivery link, files and progress notes.
- **Editors directory.** A public page for browsing editor profiles.
- **Dashboards.** Company and admin dashboards with stats (Recharts).
- **Admin by email.** Admin routes check the signed-in email against `ADMIN_EMAIL`, so no admin flag lives in the database.
- Terms and privacy pages.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Database | PostgreSQL on Neon |
| ORM | Prisma 6 |
| Auth | Clerk |
| Background jobs | Inngest |
| State | Redux Toolkit |
| Styling | Tailwind CSS 4 |
| Uploads | ImageKit |
| AI | OpenAI API |
| Other | Stripe, Recharts, react-hot-toast |

## Data model

```
User ──1:1── EditorProfile ──1:N── JobApplication ──N:1── Job ──N:1── Company ──1:1── User
```

Full schema: [`prisma/schema.prisma`](prisma/schema.prisma).

## Running locally

**Requirements:** Node.js 20+, a PostgreSQL database (a free Neon project works), a Clerk app, an ImageKit account, and optionally OpenAI and Inngest keys.

```bash
git clone https://github.com/susil-jayakumar/editra.git
cd editra
npm install            # also runs `prisma generate`
cp .env.example .env   # fill in your own values
npx prisma db push     # creates the tables
npm run dev
```

Every environment variable the app reads is listed in [`.env.example`](.env.example).

## Credits

Team project. My part: the editor profile pages. The project started from the open-source **GoCart** multi-vendor template by GreatStack and was rebuilt into a freelancing platform; some e-commerce parts of the template (cart, orders, products, coupons) are still in the codebase.

## Author

Susil Kumar J · [GitHub](https://github.com/susil-jayakumar) · [Portfolio](https://susil-jayakumar.github.io)
