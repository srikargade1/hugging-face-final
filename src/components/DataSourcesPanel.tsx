import { useState } from 'react';
import { RoomPanel } from '@sqlrooms/room-shell';
import { TableStructurePanel } from '@sqlrooms/sql-editor';
import { FileDropzone } from '@sqlrooms/dropzone';
import { useRoomStore, RoomPanelTypes } from '../store';
import { convertToValidColumnOrTableName } from '@sqlrooms/utils';
import { useToast, Button, Input } from '@sqlrooms/ui';

export const DataSourcesPanel = () => {
  const connector = useRoomStore((state) => state.db.connector);
  const refreshTableSchemas = useRoomStore((state) => state.db.refreshTableSchemas);
  const { toast } = useToast();

  const [hfId, setHfId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleHuggingFaceLoad = async () => {
    if (!connector) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connector not initialized',
      });
      return;
    }

    setLoading(true);
    try {
      const apiUrl = `https://huggingface.co/api/datasets/${hfId}/revision/main`;
      const apiResp = await fetch(apiUrl);
      
      if (!apiResp.ok) {
        throw new Error(`HTTP error! status: ${apiResp.status}`);
      }
      
      const apiJson = await apiResp.json();

      // Check if siblings exist
      if (!apiJson.siblings || !Array.isArray(apiJson.siblings)) {
        throw new Error('Invalid dataset structure or dataset not found');
      }

      const supportedFile = apiJson.siblings.find((f: any) =>
        ['.csv', '.json', '.jsonl', '.parquet', '.arrow'].some(ext =>
          f.rfilename?.toLowerCase().endsWith(ext)
        )
      );

      if (!supportedFile) {
        throw new Error('No CSV, JSON, JSONL, Parquet, or Arrow file found in dataset.');
      }

      const fileUrl = `https://huggingface.co/datasets/${hfId}/resolve/main/${supportedFile.rfilename}`;
      const fileExt = supportedFile.rfilename.split('.').pop()?.toLowerCase() || '';
      const mimeType =
        fileExt === 'csv' ? 'text/csv' :
        fileExt === 'json' ? 'application/json' :
        fileExt === 'jsonl' ? 'application/jsonl' :
        fileExt === 'parquet' ? 'application/octet-stream' :
        fileExt === 'arrow' ? 'application/vnd.apache.arrow.file' :
        'application/octet-stream';

      const fileResp = await fetch(fileUrl);
      if (!fileResp.ok) {
        throw new Error(`Failed to fetch file: ${fileResp.status}`);
      }
      
      const blob = await fileResp.blob();
      const file = new File([blob], supportedFile.rfilename, { type: mimeType });

      const tableName = convertToValidColumnOrTableName(file.name);
      
      // Check if loadFile method exists
      if (typeof connector.loadFile === 'function') {
        await connector.loadFile(file, tableName);
      } else {
        throw new Error('Connector does not support loadFile method');
      }

      toast({
        variant: 'default',
        title: 'Dataset loaded',
        description: `Hugging Face dataset ${hfId} loaded as ${tableName}`,
      });
      
      await refreshTableSchemas();
      setHfId(''); // Clear input after successful load
    } catch (error: any) {
      console.error('Error loading Hugging Face dataset:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to load Hugging Face dataset: ${error.message || error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = async (files: File[]) => {
    if (!connector) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connector not initialized',
      });
      return;
    }

    for (const file of files) {
      try {
        const tableName = convertToValidColumnOrTableName(file.name);
        
        if (typeof connector.loadFile === 'function') {
          await connector.loadFile(file, tableName);
        } else {
          throw new Error('Connector does not support loadFile method');
        }
        
        toast({
          variant: 'default',
          title: 'Table created',
          description: `File ${file.name} loaded as ${tableName}`,
        });
      } catch (error: any) {
        console.error(`Error loading file ${file.name}:`, error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Error loading file ${file.name}: ${error.message || error}`,
        });
      }
    }
    await refreshTableSchemas();
  };

  return (
    <RoomPanel type={RoomPanelTypes.enum['data-sources']}>
      <div className="mb-4">
        <label className="text-sm font-medium">Load Hugging Face Dataset</label>
        <div className="flex gap-2 mt-2">
          <Input
            value={hfId}
            onChange={(e) => setHfId(e.target.value)}
            placeholder="e.g., Anthropic/EconomicIndex"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && hfId) {
                handleHuggingFaceLoad();
              }
            }}
          />
          <Button 
            disabled={loading || !hfId} 
            onClick={handleHuggingFaceLoad}
          >
            {loading ? 'Loading...' : 'Load'}
          </Button>
        </div>
      </div>

      <FileDropzone
        className="h-[200px] p-5"
        acceptedFormats={{
          'text/csv': ['.csv'],
          'text/tsv': ['.tsv'],
          'application/octet-stream': ['.parquet'],
          'application/json': ['.json'],
          'application/jsonl': ['.jsonl'],
          'application/vnd.apache.arrow.file': ['.arrow'],
        }}
        onDrop={handleFileDrop}
      >
        <div className="text-muted-foreground text-xs">
          Files you add will stay local to your browser.
        </div>
      </FileDropzone>

      <TableStructurePanel />
    </RoomPanel>
  );
};