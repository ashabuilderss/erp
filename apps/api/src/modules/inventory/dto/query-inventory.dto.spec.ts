import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryInventoryDto } from './query-inventory.dto';

describe('QueryInventoryDto', () => {
  it('coerces string "true" to boolean true', async () => {
    const dto = plainToInstance(QueryInventoryDto, { lowStock: 'true' });
    expect(dto.lowStock).toBe(true);
    expect(await validate(dto)).toEqual([]);
  });

  it('coerces string "false" to boolean false', async () => {
    const dto = plainToInstance(QueryInventoryDto, { lowStock: 'false' });
    expect(dto.lowStock).toBe(false);
    expect(await validate(dto)).toEqual([]);
  });

  it('coerces unknown strings to boolean false', async () => {
    const dto = plainToInstance(QueryInventoryDto, { lowStock: 'yes' });
    expect(dto.lowStock).toBe(false);
    expect(await validate(dto)).toEqual([]);
  });
});
