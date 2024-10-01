import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    console.log('email added');

    await prismadb.waitlistSignup.upsert({
      where: {
        email,
      },
      create: {
        email,
      },
      update: {},
    });

    if (!email) {
      // invalid request
      return new Response('Missing email', { status: 400 });
    }
  } catch (err) {
    console.log(err);
    return new Response('Invalid request', { status: 400 });
  }
  return new Response('OK', { status: 200 });
}
