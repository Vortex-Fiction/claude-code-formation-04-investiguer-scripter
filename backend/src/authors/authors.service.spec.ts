import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../db/database';
import { AuthorsService } from './authors.service';

describe('AuthorsService', () => {
  let service: AuthorsService;

  beforeEach(async () => {
    service = new AuthorsService(await createDatabase(':memory:'));
  });

  it('lists the seeded authors', async () => {
    expect(await service.list()).toHaveLength(3);
  });

  it('creates an author', async () => {
    const author = await service.create({ name: 'Charlotte Brontë' });
    expect(author.name).toBe('Charlotte Brontë');
    expect(await service.list()).toHaveLength(4);
  });

  it('rejects an author without a name', async () => {
    await expect(service.create({})).rejects.toThrow(BadRequestException);
  });

  it('rejects an author with an empty name', async () => {
    await expect(service.create({ name: '' })).rejects.toThrow(BadRequestException);
  });

  it('rejects a name made of spaces', async () => {
    await expect(service.create({ name: '   ' })).rejects.toThrow(BadRequestException);
  });
});
