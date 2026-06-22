import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface ReportMarkdownProps {
  content: string;
  className?: string;
}

export function ReportMarkdown({ content, className }: ReportMarkdownProps) {
  return (
    <div className={cn('report-markdown', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}