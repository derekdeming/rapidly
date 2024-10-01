interface AIResponseAreaProps {
  aiResponse: string;
}

export const AIResponseArea = ({ aiResponse }: AIResponseAreaProps) => {
  return (
    <div className="p-4 my-4 rounded border border-gray-300">
      <h3 className="font-semibold mb-2">AI Response</h3>
      <div className="text-gray-700 whitespace-pre-wrap">{aiResponse}</div>
    </div>
  );
};
