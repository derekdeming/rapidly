import { parseCode } from '@/lib/code';
import { useEffect, useState } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Code } from '@/components/chat/Code';
import Typewriter from 'typewriter-effect';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import moment from 'moment';
import Icon from './Icon';
import { Link } from 'lucide-react';
export interface Source {
  chunks: string[];
  metadata: {
    file_type: string;
    last_author_name: string;
    last_author_picture_url: string;
    last_modified: string;
    title: string;
    url: string;
  };
}

export interface MessageData {
  id: string;
  isUser: boolean;
  message?: string;
  status?: string;
  errorMsg?: string;
  subqueries?: string[];
  sources?: Source[];
  isNew?: boolean;
}

interface MessageProps {
  messageData: MessageData;
  isNew?: boolean;
}

export default function Message({ messageData, isNew = false }: MessageProps) {
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const { message, isUser, id, sources, subqueries, status } = messageData;

  const { codesArr, withoutCodeArr } = parseCode(message || "");
  let result = withoutCodeArr.map((item, index) => {
    return codesArr[index] ? [item, codesArr[index]] : [item];
  });

  useEffect(() => {
    // TODO: get avatar from user
    // const local = localStorage.getItem('user');
    // if (local) {
    //   const user = JSON.parse(local);
    //   if (user.avatar)
    //     setAvatar(user.avatar);
    // }
    setAvatar('https://ui.shadcn.com/avatars/03.png');
  }, []);

  if (status === 'error') {
    return (
      <div
        className={`${!isUser ? 'py-7' : 'py-1'} h-fit ${
          !isUser ? 'dark:bg-neutral-900 bg-neutral-100' : 'bg-inherit'
        }`}
      >
        <div className="flex flex-row gap-6 w-[70%] max-[900px]:w-[88%]  mx-auto items-start">
          {isUser ? (
            <>
              <Avatar className="w-10 h-10">
                <AvatarImage src={avatar ?? 'https://ui.shadcn.com/avatars/03.png'} />
              </Avatar>
            </>
          ) : (
            <Image alt="Logo" src="/logo.png" width={32} height={32} />
          )}
          <span className="leading-8 w-[97%]">
            <div className="text-red-500">{messageData.errorMsg}</div>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${!isUser ? 'py-7' : 'py-1'} h-fit ${
        !isUser ? 'dark:bg-neutral-900 bg-neutral-100' : 'bg-inherit'
      }`}
    >
      <div className="flex flex-row gap-6 w-[70%] max-[900px]:w-[88%]  mx-auto items-start">
        {isUser ? (
          <>
            <Avatar className="w-10 h-10">
              <AvatarImage src={avatar ?? 'https://ui.shadcn.com/avatars/03.png'} />
            </Avatar>
          </>
        ) : (
          <Image alt="Logo" src="/logo.png" width={32} height={32} />

          // <span className="">{Logo}</span>
        )}
        <span className="leading-8 w-[97%]">
          {isUser || !isNew ? (
            <>
              {result.flat().map((item: any, index: number) => {
                return (
                  <div key={id + index}>
                    {typeof item == 'string' ? (
                      item
                    ) : (
                      <div className="mb-1 w-[94%] z-50">
                        <Code language={item.language}>{item.code}</Code>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {result.flat().map((item: any) => {
                return (
                  <>
                    {typeof item == 'string' ? (
                      <TypeOnce>{item}</TypeOnce>
                    ) : (
                      <div className="mb-1 w-[94%] z-50">
                        <Code language={item.language}>{item.code}</Code>
                      </div>
                    )}
                  </>
                );
              })}
            </>
          )}
          <>
            {sources && (
              <Accordion type="single" collapsible className="w-full">
                {subqueries && (
                  <AccordionItem value="subqueries">
                    <AccordionTrigger>{subqueries.length} subqueries</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {subqueries &&
                        subqueries.map((subquery, index) => (
                          <div key={index} className="text-xs">
                            {subquery}
                          </div>
                        ))}
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="sources">
                  <AccordionTrigger>{sources.length} sources</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {sources &&
                      sources.map(
                        (source, index) => (
                          <>
                            <Card className="w-full">
                              <CardHeader>
                                <CardTitle>
                                  <a href={source.metadata.url} className="group">
                                    <div className="flex flex-row items-center">
                                      <div className="flex flex-row items-center">
                                        <Icon
                                          mainImagePath="/icons/integrations/google_drive.png"
                                          overlayImagePath="/icons/file_types/google/docs.png"
                                        />
                                        <span className="mr-3 hover:text-blue-700">
                                          {source.metadata.title}
                                        </span>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100">
                                        <Link />
                                      </div>
                                    </div>
                                  </a>
                                </CardTitle>
                                <CardDescription>
                                  <div className="flex flex-row items-center">
                                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                      <Image
                                        alt="avatar"
                                        width={24}
                                        height={24}
                                        src={source.metadata.last_author_picture_url}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>
                                    <span>{source.metadata.last_author_name}</span>
                                  </div>
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                {source.chunks[0]}
                                {source.chunks.length > 1 && (
                                  <details className="mt-2">
                                    <summary className="text-sm text-blue-500 cursor-pointer">
                                      Show additional relevant texts
                                    </summary>
                                    <ul className="pl-4 mt-2">
                                      {source.chunks
                                        .slice(1)
                                        .map((textChunk: string, idx: number) => (
                                          // Highlight the chunk text based on the user's query
                                          <li key={idx} className="mt-1 text-xs">
                                            {textChunk}
                                          </li>
                                        ))}
                                    </ul>
                                  </details>
                                )}
                                {/* {source.node.text} */}
                              </CardContent>
                              <CardFooter>
                                <span className="text-slate">
                                  Last modified{' '}
                                  {moment(new Date(source.metadata.last_modified)).fromNow()}
                                </span>
                              </CardFooter>
                            </Card>
                          </>
                        )

                        // <div key={index}>{source.node.text}</div>
                      )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        </span>
      </div>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className={`py-7 h-fit dark:bg-neutral-900 bg-neutral-100`}>
      <div className="flex flex-row gap-6 w-[70%] max-[900px]:w-[88%]  mx-auto items-start">
        {/* <span className="">{Logo}</span> */}
        <Image alt="Logo" src="/logo.png" width={32} height={32} />
        <span className="leading-8">
          <Typewriter
            options={{
              delay: 85,
              loop: true,
              autoStart: true,
            }}
            onInit={(typewriter) => {
              typewriter.typeString('...').start();
            }}
          />
        </span>
      </div>
    </div>
  );
}

function TypeOnce({ children }: { children: string }) {
  const [on, setOn] = useState(true);
  return on ? (
    <Typewriter
      options={{
        delay: 10,
      }}
      onInit={(typewriter) => {
        typewriter
          .typeString(children)
          .start()
          .callFunction(() => {
            setOn(false);
          });
      }}
    />
  ) : (
    children
  );
}
