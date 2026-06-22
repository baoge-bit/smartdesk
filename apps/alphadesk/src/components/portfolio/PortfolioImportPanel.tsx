import * as React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import type {
  PortfolioImportBrokerItem,
  PortfolioImportCommitResponse,
  PortfolioImportParseResponse,
} from '@/types/portfolio';

interface PortfolioImportPanelProps {
  brokers: PortfolioImportBrokerItem[];
  selectedBroker: string;
  onBrokerChange: (broker: string) => void;
  disabled?: boolean;
  dryRun: boolean;
  onDryRunChange: (dryRun: boolean) => void;
  parsing?: boolean;
  committing?: boolean;
  parseResult: PortfolioImportParseResponse | null;
  commitResult: PortfolioImportCommitResponse | null;
  onParse: (file: File) => void;
  onCommit: (file: File) => void;
}

export function PortfolioImportPanel({
  brokers,
  selectedBroker,
  onBrokerChange,
  disabled,
  dryRun,
  onDryRunChange,
  parsing,
  committing,
  parseResult,
  commitResult,
  onParse,
  onCommit,
}: PortfolioImportPanelProps) {
  const { t } = useI18n();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);

  const selectClass =
    'flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {t('portfolio.importTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">{t('portfolio.selectBroker')}</p>
          <select
            className={selectClass}
            value={selectedBroker}
            onChange={(e) => onBrokerChange(e.target.value)}
            disabled={disabled || parsing || committing}
          >
            {brokers.map((b) => (
              <option key={b.broker} value={b.broker}>
                {b.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
          >
            {file ? file.name : t('portfolio.chooseFile')}
          </Button>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => onDryRunChange(e.target.checked)}
            disabled={disabled || parsing || committing}
          />
          {t('portfolio.dryRun')}
        </label>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!file || disabled || parsing || committing}
            onClick={() => file && onParse(file)}
          >
            {parsing ? t('portfolio.parsing') : t('portfolio.parseCsv')}
          </Button>
          <Button
            className="flex-1"
            disabled={!file || disabled || parsing || committing}
            onClick={() => file && onCommit(file)}
          >
            {committing ? t('portfolio.committing') : t('portfolio.commitCsv')}
          </Button>
        </div>

        {parseResult && (
          <p className="text-xs text-muted-foreground">
            {t('portfolio.parseResult', {
              valid: parseResult.validRows,
              total: parseResult.totalRows,
            })}
          </p>
        )}

        {commitResult && (
          <p className="text-xs text-muted-foreground">
            {t('portfolio.importResult', {
              imported: commitResult.imported,
              skipped: commitResult.skipped,
              errors: commitResult.errors,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}