'use client';
import { Input } from '@/components/chat/Input';
import Message, { Skeleton, Source, MessageData } from '@/components/chat/Message';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';


export const ChatPage = () => {
  const [messages, setMessages] = useState<MessageData[]>([
    {
      id: uuidv4(),
      isUser: false,
      message:
        "Hi, I'm Rapidly AI! I can help you find sources for your code. Try asking me a question!",
      subqueries: ['subquery1', 'subquery2', 'subquery3', 'subquery4'],
      sources: [
        {
          chunks: ['ssssource text description preview.....', 'nnnnnnn', 'nnnnsdkfjdklsfjdks'],
          metadata: {
            file_type: 'application/vnd.google-apps.document',
            last_author_name: 'Edward Dan',
            last_author_picture_url:
              'https://cdn.discordapp.com/guilds/402595584944504834/users/315850603396071424/avatars/a_e604e66a4df14fe96afe7d9a4c8dfb1b.gif?size=256',
            last_modified: '2021-10-17T15:46:00.000Z',
            title: 'Some source title',
            url: 'https://google.com',
          },
        },
        {
          chunks: [
            'source text description preview.....source text description preview.....source text description preview.....source text description preview.....source text description preview.....source text description preview.....source text description preview.....source text description preview.....',
          ],
          metadata: {
            file_type: 'application/pdf',
            last_author_name: 'Edward Dan',
            last_author_picture_url:
              'https://cdn.discordapp.com/guilds/402595584944504834/users/315850603396071424/avatars/a_e604e66a4df14fe96afe7d9a4c8dfb1b.gif?size=256',
            last_modified: '2021-10-17T15:46:00.000Z',
            title: 'Some source title2',
            url: 'https://google.com',
          },
        },
      ],
    },
  ]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  
  const handleButtonClick = (buttonText: string) => {
    setMessage(buttonText);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/message');
      setMessages(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'error fetching messages');
      } else {
        toast.error('unexpected error');
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchMessages();
  }, []);

  function getMessage() {
    setLoading(true);
    setMessages((prev) => [...prev, { id: uuidv4(), isUser: true, message }]);
    const t = message;

    setMessage('');

    const eventSource = new EventSource(`/api/chat?message=${encodeURIComponent(t)}`);
    eventSource.onmessage = (event) => {
      setLoading(false);
      const data = JSON.parse(event.data);
      console.log('data', data);
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          isUser: false,
          message: data.message,
          subqueries: data.subqueries,
          sources: data.sources,
        },
      ]);
    };

    // axios
    //   .post('/api/chat', {
    //     messages,
    //   })
    //   .then(({ data }) => {
    //     console.log('data', data);
    //     setMessages((prev) => [
    //       ...prev,
    //       { id: uuidv4(), isUser: false, message: data.message, isNew: true },
    //     ]);
    //   })
    //   .catch((err) => {
    //     if (err instanceof AxiosError) toast.error(err.response?.data?.message || err.message);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
  }

  function clearMessages() {
    setMessages([]);
  }

  function updateScroll() {
    let element = scrollRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(updateScroll, [messages]);

  return (
    <div>
      <div className="input w-full flex flex-col justify-between h-screen">
        <div className="flex h-full items-center justify-center ">
          <div className="flex w-full flex-col items-center justify-center">
            <div>
              <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" height="40" width="40" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            </div>
            
            <div className="mb-2 w-3/4 text-center text-lg font-bold">Ask Rapidly about your enterprise knowledge base, such as:</div>
            <div className="m-auto flex w-full flex-wrap justify-center">
            <button
                className="m-1 flex-shrink rounded-full border border-gray-60 px-3 py-1 hover:bg-gray-15"
                onClick={() => handleButtonClick("Where can I find the latest information on the Rapidly API documentation?")}
              >
                Where can I find the latest information on the Rapidly API documentation?
              </button>
              <button
                className="m-1 flex-shrink rounded-full border border-gray-60 px-3 py-1 hover:bg-gray-15"
                onClick={() => handleButtonClick("What documentation needs to be updated with the latest prod release?")}
              >
                What documentation needs to be updated with the latest prod release?
              </button>
              <button
                className="m-1 flex-shrink rounded-full border border-gray-60 px-3 py-1 hover:bg-gray-15"
                onClick={() => handleButtonClick("Can you explain Rapidly onboarding process and where do I submit my badge information?")}
              >
                Can you explain Rapidly onboarding process and where do I submit my badge information?
              </button>
            </div>
          </div>
        </div>
        <div
          className="messages w-full mx-auto h-full mb-4 overflow-auto flex flex-col gap-10 pt-10 max-[900px]:pt-20 scroll-smooth"
          ref={scrollRef}
        >
          {messages.map((message) => (
            <Message key={message.id} messageData={message} isNew={message.isNew ?? false} />
          ))}
          {loading && <Skeleton />}
        </div>
        <div className="w-[70%] max-[900px]:w-[90%] flex flex-row gap-3 mx-auto mt-auto">
          <Input
            onKeyDown={(e) => {
              if (e.keyCode == 13 && message) {
                getMessage();
              }
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message"
            className="h-12"
          />
          <Button disabled={!message} onClick={getMessage} className="h-12 font-semibold">
            Send
          </Button>
        </div>
        <span className="mx-auto mb-6 text-xs mt-3 text-center">
          Rapidly AI may produce inaccurate information. Please always double check your sources
          manually!
        </span>
      </div>
    </div>
  );
};

export default ChatPage;
