import { NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import axios from 'axios';
import { StreamingTextResponse } from 'ai';

const handler = async (req: NextRequest, res: NextApiResponse) => {
  try {
    const { method, url, headers, body } = req;

    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { user } = session;
    const { name, email, image, id } = user as any; // TODO: fix type

    // pass in user session details in headers
    const proxiedHeaders = {
      ...headers,
      'x-user-name': name,
      'x-user-email': email,
      'x-user-image': image,
      'x-user-id': id,
    };

    if (!url) return res.status(500).json({ error: 'Missing URL' });

    // grab path after /api/py/:path*
    const pathSuffix = url.split('/py')[1];

    // header for useStream
    const useStream = headers.get('x-use-stream') === 'true';

    const response = await axios({
      method,
      url: process.env.PYTHON_BACKEND_URL + pathSuffix,
      headers: proxiedHeaders as any,
      data: body,
      responseType: useStream ? 'stream' : undefined,
    });

    if (useStream) {
      return new StreamingTextResponse(response.data);
    } else {
      return new Response(JSON.stringify(response.data), { status: 200 });
    }
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
};

export { handler as GET, handler as POST };
