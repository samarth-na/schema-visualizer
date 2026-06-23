'use client';

import type { Edge } from '@xyflow/react';
import { createContext, type ReactNode, useContext } from 'react';

export type SchemaGraphContextType = {
  isDownloading: boolean;
  selectedEdge: Edge | undefined;
};

const SchemaGraphContext = createContext<SchemaGraphContextType | null>(null);

export const SchemaGraphContextProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: SchemaGraphContextType;
}) => <SchemaGraphContext.Provider value={value}>{children}</SchemaGraphContext.Provider>;

export const useSchemaGraphContext = () => {
  const context = useContext(SchemaGraphContext);
  if (!context) {
    throw new Error('useSchemaGraphContext must be used inside a <SchemaGraphContextProvider>');
  }
  return context;
};
