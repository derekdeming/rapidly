'use client';

import * as React from 'react';
import { DropdownMenuCheckboxItemProps } from '@radix-ui/react-dropdown-menu';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from '@/app/(dashboard)/(routes)/search/page';
import { Filter as FilterIcon } from 'lucide-react';
import Image from 'next/image';

type Checked = DropdownMenuCheckboxItemProps['checked'];

interface FilterTabsProps {
  fileTypeFilters: Filter[];
  sourceFilters: Filter[];
  onFileTypeFilterChange: (filterType: string, filterValue: boolean) => void;
  onSourceFilterChange: (filterType: string, filterValue: boolean) => void;
}

const filterStringGenerator = (filters: Filter[]) => {
  // if no filters, say "None"
  // if multiple filters, say the first one and "and x more"
  // if one filter, say that one

  const filterKeys = filters.filter((f) => f.checked);
  const filterCount = filterKeys.length;

  if (filterCount === 0) {
    return 'None';
  } else if (filterCount === 1) {
    return filterKeys[0].label;
  } else {
    return `${filterKeys[0].label} and ${filterCount - 1} more`;
  }
};

export const FilterTabs = ({
  fileTypeFilters,
  sourceFilters,
  onFileTypeFilterChange,
  onSourceFilterChange,
}: FilterTabsProps) => {
  const sourceStr = filterStringGenerator(sourceFilters);
  const fileTypeStr = filterStringGenerator(fileTypeFilters);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FilterIcon className="pr-2" /> Source Type: {sourceStr}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full">
          <DropdownMenuLabel>Sources</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {sourceFilters.map(
            ({ label, icon, checked }: { label: string; icon: string; checked: boolean }) => (
              <DropdownMenuCheckboxItem
                key={label}
                checked={checked}
                onCheckedChange={(checked) => onSourceFilterChange(label, checked)}
              >
                {<Image src={icon} width={20} height={20} alt={`${label} icon`} />} {label}
              </DropdownMenuCheckboxItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FilterIcon className="pr-2" /> File Type: {fileTypeStr}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full">
          <DropdownMenuLabel>File Types</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {fileTypeFilters.map(
            ({ label, icon, checked }: { label: string; icon: string; checked: boolean }) => (
              <DropdownMenuCheckboxItem
                key={label}
                checked={checked}
                onCheckedChange={(checked) => onSourceFilterChange(label, checked)}
              >
                {<Image src={icon} width={20} height={20} alt={`${label} icon`} />} {label}
              </DropdownMenuCheckboxItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
