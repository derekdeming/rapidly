'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema } from './constants';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import openai from 'openai';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { SearchBar } from '@/components/search/searchbar';
import { FilterTabs } from '@/components/search/filter-tabs';
import { z } from 'zod';

const SOURCE_ICONS = {
  'notion.so': '/icons/notion.png',
  'github.com': '/icons/github.png',
  'google.com': '/icons/google.png',
  'teams.microsoft.com': '/icons/microsoft_teams.png',
};

const DOCUMENT_ICONS = {
  'drive/application/pdf': '/icons/pdf.png',
  'drive/application/vnd.google-apps.document': '/icons/google-doc.png',
  'drive/application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '/icons/docx.png',
  any: '/icons/default-doc.png',
};

const SOURCES = [
  {
    label: 'Notion',
    icon: '/integrations/notion.png',
    url: 'notion.so',
  },
  {
    label: 'Confluence',
    icon: '/integrations/Confluence.png',
    url: 'atlassian.com',
  },
  {
    label: 'Google Drive',
    icon: '/integrations/GDrive.png',
    url: 'drive.google.com',
  },
  {
    label: 'Slack',
    icon: '/integrations/Slack.png',
    url: 'slack.com',
  },
];

const FILE_TYPES = [
  {
    label: 'PDF',
    icon: '/icons/pdf.png',
    type: 'application/pdf',
  },
  {
    label: 'Google Doc',
    icon: '/icons/google-doc.png',
    type: 'application/vnd.google-apps.document',
  },
  {
    label: 'Word Doc',
    icon: '/icons/docx.png',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
];

export interface Filter {
  label: string;
  icon: string;
  checked: boolean;
}

const SearchPage = () => {
  const router = useRouter();

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [sourceFilters, setSourceFilters] = useState<Filter[]>(
    SOURCES.map((source) => ({
      label: source.label,
      icon: source.icon,
      checked: false,
    }))
  );
  const [fileTypeFilters, setFileTypeFilters] = useState<Filter[]>(
    FILE_TYPES.map((source) => ({
      label: source.label,
      icon: source.icon,
      checked: false,
    }))
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });
  const userQuery = form.getValues().prompt;

  const onFileTypeFilterChange = (filterType: string, filterValue: boolean) => {
    setFileTypeFilters((prev) => ({ ...prev, [filterType]: filterValue }));
  };

  const onSourceFilterChange = (filterType: string, filterValue: boolean) => {
    setSourceFilters((prev) => ({ ...prev, [filterType]: filterValue }));
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

  const handleResponseGeneration = async (prompt: string) => {
    try {
      setAiResponse('🤔 Thinking...');
      const userMessage: openai.Chat.Completions.CreateChatCompletionRequestMessage = {
        role: 'user',
        content: prompt,
      };
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
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Something went wrong');
    } finally {
      router.refresh(); // allows sidebar to refresh api count
    }
  };

  const onSearch = async (values: z.infer<typeof formSchema>) => {
    setSources([]);
    setIsLoading(true);
    fetchSources(values.prompt);
    handleResponseGeneration(values.prompt);
    setPage(1);
  };

  const groupedSources = sources.reduce((acc, source) => {
    if (!source.node || !source.node.metadata) return acc;
    const { metadata, text } = source.node;
    const { src } = metadata;

    if (!acc[src]) {
      acc[src] = {
        metadata: metadata,
        texts: [text],
      };
    } else {
      acc[src].texts.push(text);
    }
    return acc;
  }, {});

  return (
    <div>
      <div>
        <SearchBar form={form} onSearch={onSearch} isLoading={isLoading} />
        <FilterTabs
          sourceFilters={sourceFilters}
          fileTypeFilters={fileTypeFilters}
          onFileTypeFilterChange={onFileTypeFilterChange}
          onSourceFilterChange={onSourceFilterChange}
        />
      </div>
    </div>
  );
};

export default SearchPage;
