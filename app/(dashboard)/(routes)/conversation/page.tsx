'use client';

import * as z from 'zod';
import { Heading } from '@/components/heading';
import { Link } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { formSchema } from './constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Form, FormField } from '@/components/ui/form';

import { Button } from '@/components/ui/button';
import Pagination from '@/components/pagination';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import openai from 'openai';
import Empty from '@/components/empty';
import { useProModal } from '@/hooks/use-pro-modal';
import { toast } from 'react-hot-toast';
import ResultPreview from '@/components/result-preview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToasterProvider } from '@/components/providers/toaster';
import { escapeRegExp } from 'lodash';
import moment from 'moment';

function parseResponse(response) {
  const splitRegex = /(\*\*[^*]+\*\*)/g;
  return response.split(splitRegex).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const ConversationPage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const [messages, setMessages] = useState<
    openai.Chat.Completions.CreateChatCompletionRequestMessage[]
  >([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const iconPath = '/logo.png';
  // adding pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  // const handleTextAreaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const textArea = e.target;
  //   textArea.style.height = 'auto'; // Reset height to auto
  //   textArea.style.height = textArea.scrollHeight + 'px'; // Set it to scroll height
  // };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });
  const userQuery = form.getValues().prompt;

  const highlightText = (text: string, keyword: string) => {
    const escapedKeyword = escapeRegExp(keyword);
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const sourceIcons = {
    'notion.so': '/icons/notion.png',
    'atlassian.net': '/icons/integrations/confluence.png',
    'wikipedia.org': '/icons/wikipedia.png',
    'github.com': '/icons/github.png',
    'google.com': '/icons/google.png',
    'teams.microsoft.com': '/icons/microsoft_teams.png',
  };

  const documentIcons = {
    'application/pdf': '/icons/pdf.png',
    'application/vnd.google-apps.document': '/icons/google-docs.png',
    'drive/application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      '/icons/docx.png',
    default: '/icons/default-doc.png',
  };

  const fetchSources = async (query: string) => {
    try {
      const response = await axios.get(`/api/py/qa/sources?q=${encodeURIComponent(query)}`);
      setSources(response.data.items);
      return response.data;
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw error;
    }
  };
  // console.log("Total pages:", totalPages);

  const handleSearchSources = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const data = await fetchSources(searchQuery);
      console.log('Fetched data:', data);
      setSources(data.items);
      console.log("sources:", data.items);
      setTotalPages(Math.ceil(data.items.length / itemsPerPage));
    } catch (error) {
      console.error(error);
      setSources([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleResponseGeneration = async (prompt: string) => {
    try {
      setAiResponse('🤔 Thinking...');
      const userMessage: openai.Chat.Completions.CreateChatCompletionRequestMessage = {
        role: 'user',
        content: prompt,
      };
      const newMessages = [...messages, userMessage];
      const response = await fetch(`/api/py/qa/response?q=${encodeURIComponent(prompt)}`, {
        headers: { 'x-use-stream': 'true' },
      });
      const reader = response.body!.getReader();
      let completeData = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = new TextDecoder('utf-8').decode(value);
        completeData += chunkText;

        // updating the state here if you want to display each chunk as it comes in
        setAiResponse(completeData);
      }
      setIsLoading(false);
      setMessages(newMessages);
    } catch (error) {
      if ((error as any).response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      router.refresh(); // allows sidebar to refresh api count
    }
  };

  const onSearch = async (values: z.infer<typeof formSchema>) => {
    setSources([]);
    setIsLoading(true);
    handleSearchSources(values.prompt);
    handleResponseGeneration(values.prompt);
  };
  const groupedSources = sources.reduce((acc, source) => {
    if (!source.node || !source.node.metadata) return acc;
    const { metadata, text } = source.node;
    const { id } = metadata;

    if (!acc[id]) {
      acc[id] = {
        metadata: metadata,
        texts: [text],
      };
    } else {
      acc[id].texts.push(text);
    }
    return acc;
  }, {});

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-100 to-purple-100">
      <Heading
        title="Enhanced Augmented Search Over Your Data"
        description="Improve Productivity via Search"
        iconPath={iconPath}
        bgColor="bg-gradient-to-r from-pink-400 to-blue-500"
        className="mb-6"
      />
      <div className="bg-white shadow-lg rounded-lg p-6 mx-auto w-5/6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSearch)}
            className="flex space-x-4 items-center w-full"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <div className="flex-grow mr-4">
                  <input
                    className="w-full p-2 rounded-md overflow-x-hidden resize-none border border-gray-200 bg-opacity-10 focus:ring-2 focus:ring-blue-200"
                    disabled={isLoading}
                    placeholder="Ask your question here..."
                    // onInput={handleTextAreaResize}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSearch)();
                      }
                    }}
                    {...field}
                  />
                </div>
              )}
            />
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded py-2 px-4"
              disabled={isLoading}
            >
              {/* {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
              {isLoading ? <Loader2 className="animate-spin" /> : 'Ask ↵'}
            </Button>
          </form>
        </Form>
        {aiResponse && (
  <div className="mt-4 p-4 rounded border border-gray-200">
    <h3 className="font-semibold">Rapidly AI Answer</h3>
    <br />
    <p className="text-gray-700">
      {isLoading ? (
        <span className="whitespace-pre-wrap">
          {parseResponse(aiResponse)}
          <span className="animate-[blink_0.5s_infinite]">▌</span>
        </span>
      ) : (
        <div className="whitespace-pre-wrap">{parseResponse(aiResponse)}</div>
      )}
    </p>
  </div>
)}

        {sources.length > 0 && (
          <>
            <div className="mt-4 p-4 rounded border">
              <h3 className="font-bold">Sources:</h3>
              <ul>
                {Object.entries(groupedSources)
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map(([key, groupedSource]) => {
                    const { metadata, texts } = groupedSource as any;
                    const { title, url, file_type, last_modified } = metadata;
                    if (!metadata) {
                      return null;
                    }

                    const domainParts = new URL(url).hostname.split('.');
                    const baseDomain = domainParts.slice(-2).join('.');
                    const fileType = file_type as keyof typeof documentIcons;
                    const documentIconSrc = documentIcons[fileType] || documentIcons['default'];

                    const lastModifiedTimestamp = moment(new Date(last_modified));

                    return (
                      <div
                        key={key}
                        className="group mt-4 p-4 rounded border transition-transform transform-gpu hover:translate-y-[-4px] hover:shadow-lg"
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-4"
                        >
                          <div className="icons relative w-12 h-12 flex-shrink-0">
                            <img
                              src={(sourceIcons as any)[baseDomain]} // This is the main source now.
                              alt={`${baseDomain} icon`}
                              className="w-full h-full absolute top-0 left-0 object-cover object-position-center"
                            />
                            {documentIconSrc != documentIcons['default'] && <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                              <img
                                src={documentIconSrc} // This is the document type now.
                                alt={`${fileType || 'document'} icon`}
                                className="w-4 h-4"
                              />
                            </div>}
                          </div>
                          <div>
                            <div className="flex flex-col font-semibold justify-center space-x-2">
                              {/* Highlight the title based on the user's query */}
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(title, userQuery),
                                }}
                              ></div>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-slate-400 pb-3">
                                    Last Modified {lastModifiedTimestamp.fromNow()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {lastModifiedTimestamp.format('MMM. D, YYYY h:mm a')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <div className="whitespace-pre-wrap text-xs text-slate-500">
                              {texts.map((text: string, idx: number) => {
                                const truncatedText = text.split('\n', 4).join('\n');
                                // Highlight the chunk text based on the user's query
                                return (
                                  <div
                                    key={idx}
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(truncatedText, userQuery),
                                    }}
                                  ></div>
                                );
                              })}
                            </div>
                          </div>
                        </a>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 group">
                                <button
                                  className="p-2 rounded bg-gray-200 hover:bg-gray-100 transition-colors focus:outline-none"
                                  onClick={() => {
                                    navigator.clipboard.writeText(url);
                                    toast.success('Copied link to clipboard!');
                                  }}
                                >
                                  <Link className="w-6 h-6" />
                                </button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <details className="mt-2">
                          <summary className="text-sm text-blue-500 cursor-pointer">
                            See Relevant Chunks
                          </summary>
                          <ul className="pl-4 mt-2">
                            {texts.map((textChunk: string, idx: number) => (
                              // Highlight the chunk text based on the user's query
                              <li
                                key={idx}
                                className="mt-1 text-xs"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(textChunk, userQuery),
                                }}
                              ></li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    );
                    // <li key={index}>{typeof source === 'string' ? source : JSON.stringify(source)}</li>
                  })}
              </ul>
            </div>
            {sources.length > 0 && totalPages >= 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        <div className="mt-6">
          {/* {isLoading && (
            <div className="rounded w-full flex items-center justify-center bg-muted p-4">
              <Loader />
            </div>
          )} */}

          {/* {messages.map((message, index) => (
            <div
              className={cn(
                'p-4 my-2 rounded',
                message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
              )}
              key={index}
            >
              {message.role === 'user' ? <UserAvatar /> : <BotAvatar />}
              <div className="ml-4">{message.content}</div>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
