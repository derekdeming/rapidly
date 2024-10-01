import { authConfig } from '@/lib/auth';
import { getNotionUpdatesSince } from '@/lib/notion';
import { getServerSession } from 'next-auth';

const TestPage = async () => {
  const session = await getServerSession(authConfig)
  // const updates = await getNotionUpdatesSince()

  console.log("session", session)

  return <div>{JSON.stringify(session)}</div>
  // <div>Hello {updates.toString()}</div>

}

export default TestPage
