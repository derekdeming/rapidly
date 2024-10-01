export { default } from "next-auth/middleware"

export const config = { matcher: ["/dashboard"] }

// // import { authMiddleware } from '@clerk/nextjs';
// import type { NextRequest } from 'next/server'

// // // This example protects all routes including api/trpc routes
// // // Please edit this to allow other routes to be public as needed.
// // // See https://clerk.com/docs/nextjs/middleware for more information about configuring your middleware
// // export default authMiddleware({
// //   publicRoutes: ['/', '/api/auth/callback/google', '/start', '/sign-in', '/sign-up', "/api/webhook"],
// // });

// // export const config = {
// //   matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
// // };

// export function middleware(request: NextRequest) {

// }