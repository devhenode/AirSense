export interface SchemaField {
  name: string;
  type: string;
  description: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
  sourceUrl: string;
  format: string;
  license: string;
  lastUpdated: string;
  records: number;
  hasGeospatialData: boolean;
  schema: SchemaField[];
  sampleData: Record<string, any>[];
}