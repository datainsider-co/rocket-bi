export type DeleteMode = 'transfer' | 'delete';

export interface DeleteUserChoice {
  readonly mode: DeleteMode;
  /** Email of the user picked from the suggestions; required to transfer. */
  readonly transferTo: string | undefined;
}

/**
 * Why Delete can't go ahead yet. v1 sent a typed email as is and, with Transfer picked but no email, deleted the data
 * without asking.
 */
export function deleteChoiceError({ mode, transferTo }: DeleteUserChoice, ownEmail: string): string | undefined {
  if (mode === 'delete') return undefined;
  if (!transferTo) return 'Pick the user who gets the data';
  if (transferTo === ownEmail) return 'Pick another user than the one being deleted';
  return undefined;
}

export function transferEmail({ mode, transferTo }: DeleteUserChoice): string | undefined {
  return mode === 'transfer' ? transferTo : undefined;
}

export function deleteConfirmText({ mode, transferTo }: DeleteUserChoice, name: string): string {
  return mode === 'transfer'
    ? `Delete ${name}? Their dashboards and folders go to ${transferTo ?? ''}.`
    : `Delete ${name} and all their dashboards and folders? This can't be undone.`;
}
