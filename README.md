This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

2. Update the following environment variables in `.env.local`:

- `NEXT_PUBLIC_PACKAGE_ID`: Your published Move package ID
- `NEXT_PUBLIC_VERSION_ID`: The Version object ID from your deployment
- `NEXT_PUBLIC_TASK_REGISTRY_ID`: The TaskRegistry shared object ID from your deployment

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Task Creation

The task creation form now supports all parameters required by the Move contract:

- **Title** (required): Task title (max 200 characters)
- **Description** (required): Task description (max 2000 characters)
- **Image URL** (optional): URL to an image for the task
- **Category** (required): Task category (max 50 characters)
- **Tags** (optional): Up to 10 tags (max 30 characters each)
- **Due Date** (optional): Task deadline
- **Priority** (required): Low (1), Medium (2), High (3), or Critical (4)

The form automatically passes the following to the Move contract:
- Version object reference
- Clock object (0x6 shared object)
- TaskRegistry object reference

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

