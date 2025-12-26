
export type Criticality = 'High' | 'Medium' | 'Low';

export interface NoteMetadata {
  subject: string;
  criticality: Criticality;
  purpose: string;
  importance: number; // 1-10
  tags: string[];
}

export interface Note extends NoteMetadata {
  id: string;
  content: string;
  createdAt: string; // ISO date string
}

export interface SearchFilters {
  query?: string;
  subject?: string;
  startDate?: string;
  endDate?: string;
  criticality?: Criticality;
  purpose?: string;
  minImportance?: number;
}
