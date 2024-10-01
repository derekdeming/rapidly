interface SearchResult {
  title: string;
  previewText: string;
  fileTypeIcon: string;
  authorName: string;
  authorImage: string;
  lastModified: string;
}

interface SearchResultsProps {
  results: SearchResult[];
}

interface SearchResultCardProps {
  result: SearchResult;
}

const SearchResultCard = ({ result }: SearchResultCardProps) => {
  return (
    <div className="p-4 mb-4 rounded border border-gray-300">
      <div className="flex space-x-4 mb-2">
        <img src={result.fileTypeIcon} alt="" className="w-6 h-6" />
        <h4 className="text-blue-600 font-semibold">{result.title}</h4>
      </div>
      <div className="flex items-center space-x-4 mb-2">
        <img src={result.authorImage} alt="" className="w-8 h-8 rounded-full" />
        <span>
          {result.authorName} - Updated {result.lastModified}
        </span>
      </div>
      <p className="text-gray-600 line-clamp-3">{result.previewText}</p>
      <button className="text-blue-500 mt-2">Show more...</button>
    </div>
  );
};

const SearchResults = ({ results }: SearchResultsProps) => {
  return (
    <div>
      {results.map((result, index) => (
        <SearchResultCard key={index} result={result} />
      ))}
    </div>
  );
};
