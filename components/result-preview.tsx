import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

interface Chunk {
  text: string;
  similarity: number;
}

interface DocumentWithChunkData {
  file_name: string;
  chunks: Chunk[];
  top_similarity: number;
}

interface ChunkPreviewProps {
  data: Chunk;
}

interface ResultPreviewProps {
  data: DocumentWithChunkData
  className?: string;
  key: any;
}

const ChunkPreview = ({ data }: ChunkPreviewProps) => {
  const { text, similarity } = data

  return <div className="rounded-md border px-4 py-3 text-sm">
    ... {text} ...
  </div>
}

const ResultPreview = ({ data }: ResultPreviewProps) => {
  const { file_name, chunks, top_similarity } = data
  const [isOpen, setIsOpen] = useState(false);
  if (chunks.length == 0) return null;


  return (
    <div className="container mx-auto rounded-md border px-4 py-3 text-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">
            {file_name}
            <div className="text-xs text-muted-foreground">{(top_similarity * 100).toFixed(2)}% match</div>
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <ChunkPreview data={chunks[0]} />
        <CollapsibleContent className="space-y-2">
          {chunks.slice(1).map((data) => (
            <ChunkPreview key={data.text} data={data} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default ResultPreview
