This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# Running the Backend (Docker Commands)

## Building and Running

- **Build Image**: 
  ```bash
  make build
  ```
  This builds the docker image.

- **Run Server for Production**: 
  ```bash
  make run
  ```
  This is intended for production and starts the server.

- **Start Persistent Container**: 
  ```bash
  make startcontainer
  ```
  Starts a persistent container using the image (but doesn't run the server script automatically).

- **Stop Persistent Container**: 
  ```bash
  make stopcontainer
  ```
  Stops the persistent container.

- **SSH into Running Container**: 
  ```bash
  make shell
  ```
  SSHs into the currently running persistent container.

- **Run Server in Running Container**: 
  ```bash
  make shellrun
  ```
  Runs the server in the currently running persistent container.

## Other Notes

- The Docker defaults to using `/app` as the working directory.
- When using the "persistent container," `/app` exists, but you should use `/mountedapp` instead. This directory is mounted as a volume, allowing a 2-way sync between your computer and the Docker container. Any changes made in the `/app` directory stays within the docker container, which will be destroyed when the container is destroyed.


