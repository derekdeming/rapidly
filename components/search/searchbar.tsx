import { Form, FormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SearchBarProps {
  form: any;
  onSearch: (data: any) => void;
  isLoading: boolean;
}

export const SearchBar = ({ form, onSearch, isLoading }: SearchBarProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSearch)} className="flex items-center w-full">
        <FormField
          name="prompt"
          render={({ field }) => (
            <div className="flex-grow">
              <input
                className="w-full p-2 rounded-bl rounded-tr focus:ring-0 overflow-x-hidden resize-none border border-gray-200 bg-opacity-10"
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
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-tr rounded-br py-2 px-4"
          disabled={isLoading}
          rounded="none"
        >
          {/* {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
          {isLoading ? <Loader2 className="animate-spin" /> : 'Ask ↵'}
        </Button>
      </form>
    </Form>
  );
};
