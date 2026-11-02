import { BadRequestException } from '@nestjs/common';

export function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('The request body must be a JSON object');
  }
  return Object.fromEntries(Object.entries(body));
}

export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new BadRequestException(`${field} should not be empty`);
  }
  return value;
}

export function requireInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException(`${field} must be an integer`);
  }
  return value;
}
