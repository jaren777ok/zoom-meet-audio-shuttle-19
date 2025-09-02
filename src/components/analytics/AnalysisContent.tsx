import React, { useState, useEffect } from 'react';
import { marked } from 'marked';

interface AnalysisContentProps {
  markdown: string;
}

export const AnalysisContent: React.FC<AnalysisContentProps> = ({ markdown }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    const convertMarkdown = async () => {
      const html = await marked(markdown);
      setHtmlContent(html);
    };
    convertMarkdown();
  }, [markdown]);

  return (
    <div 
      className="prose-lg leading-relaxed space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-2 [&_strong]:font-bold [&_em]:italic [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};