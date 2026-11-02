import { requireObject, requireText } from '../validation';

export interface CreateAuthorInput {
  name: string;
}

export function parseCreateAuthorInput(body: unknown): CreateAuthorInput {
  const fields = requireObject(body);
  return { name: requireText(fields.name, 'name') };
}
