import React from 'react';

interface RichDescriptionViewProps {
  content: string;
  className?: string;
}

export const RichDescriptionView: React.FC<RichDescriptionViewProps> = ({
  content,
  className = '',
}) => {
  if (!content || !content.trim()) return null;

  // Check if content contains HTML markup
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  if (!hasHtmlTags) {
    return (
      <div className={`text-stone-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm font-['Cairo'] text-right ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`rich-description-content text-stone-800 text-xs sm:text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
