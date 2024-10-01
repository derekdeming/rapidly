import { checkApiLimit, increaseApiLimit } from '@/lib/api-limit';
import { authConfig, getUserId } from '@/lib/auth';
import { checkSubscription } from '@/lib/subscription';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import openai from 'openai';
import openaiClient from 'openai';

const OpenAI = new openaiClient({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT =
  'You are an assistant that takes search results and a user\'s query as input, then responds correspondingly with information cited directly from the results. Do not extrapolate any information that is not within the search result content provided. You may only paraphrase and rephrase for clarity. If none of the search result information is useful for answering the query, respond with exactly "No relevant information found for your query".\n\nSearch Results:\n';

interface SearchResult {
  title: string;
  context: string[];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(session.user?.email as string)

    const body = await req.json();
    const messages = body.messages as openai.Chat.Completions.CreateChatCompletionRequestMessage[];
    const searchResults = body.searchResults as SearchResult[];

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!OpenAI.apiKey) {
      return new NextResponse('OpenAI API Key not configured', { status: 500 });
    }

    if (!messages) {
      return new NextResponse('Messages are required', { status: 400 });
    }

    if (!searchResults) {
      return new NextResponse('searchResults are required', { status: 400 });
    }

    // const freeTrial = await checkApiLimit();
    // const isPro = await checkSubscription();

    // if (!freeTrial && !isPro) {
    //   return new NextResponse('Free trial limit reached', { status: 403 });
    // }

    const formattedSystemPrompt: openaiClient.Chat.Completions.CreateChatCompletionRequestMessage = {
      role: 'system',
      content: `${SYSTEM_PROMPT}${searchResults.map(
        (sr) => `${sr.title}\n${sr.context.map((v, i) => `${i + 1}. ${v}`).join('\n')}`
      )}`,
    };

    const response = await OpenAI.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [formattedSystemPrompt, ...messages],
      // temperature: 0, // change?
    });
    // if (!isPro)
    //   await increaseApiLimit();

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.log('[CONVERSATION_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
