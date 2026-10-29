import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { DatabaseService } from '@/core/schema/DatabaseService';
import type { DatabaseInfo } from '@/core/schema/SchemaService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { schemaKeys } from '@/shared/schema/schemaQueries';
import { warehouseKeys } from '../warehouseQueries';
import { toDatabaseName } from './databaseTree.utils';

export interface CreateDatabaseDialog {
  readonly isOpen: boolean;
  readonly isSubmitting: boolean;
  /** Server error of the last submit. */
  readonly error: string | undefined;
  readonly open: () => void;
  readonly close: () => void;
  /** Creates the database named after what was typed (`toDatabaseName`). */
  readonly submit: (typed: string) => void;
}

/** The tree's "+" (v1 `DatabaseTreeView.createDatabase`): `POST databases`, then the new database in the tree. */
export function useCreateDatabase(onCreated: (database: DatabaseInfo) => void): CreateDatabaseDialog {
  const service = useDi(DatabaseService);
  const queryClient = useQueryClient();
  const [isOpen, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (typed: string) => service.create(toDatabaseName(typed), typed.trim()),
    onSuccess: async database => {
      void queryClient.invalidateQueries({ queryKey: warehouseKeys.databases });
      await queryClient.invalidateQueries({ queryKey: schemaKeys.databases });
      setOpen(false);
      onCreated(database);
    }
  });
  const { mutate, reset } = mutation;

  const open = useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);
  const close = useCallback(() => setOpen(false), []);

  return {
    isOpen,
    isSubmitting: mutation.isPending,
    error: mutation.isError ? toErrorMessage(mutation.error) : undefined,
    open,
    close,
    submit: mutate
  };
}
