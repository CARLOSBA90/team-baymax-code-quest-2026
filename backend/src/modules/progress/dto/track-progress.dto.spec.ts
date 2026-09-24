import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TrackProgressDto } from './track-progress.dto.js';

async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(TrackProgressDto, body);
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

describe('TrackProgressDto', () => {
  it.each([
    [{ completed: true }],
    [{ position_seconds: 135 }],
    [{ submission: { type: 'TEXT', content: 'respuesta' } }],
  ])(
    'accepts a report with only the item id and its data: %j',
    async (fields) => {
      expect(
        await errorsFor({ roadmap_item_id: 'item-1', ...fields }),
      ).toHaveLength(0);
    },
  );

  it('parses the submission sent as a multipart text field', async () => {
    const dto = plainToInstance(TrackProgressDto, {
      roadmap_item_id: 'item-1',
      submission: '{"type":"FILE"}',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.submission?.type).toBe('FILE');
  });

  it('requires the roadmap item id', async () => {
    const errors = await errorsFor({ completed: true });
    expect(errors.map((error) => error.property)).toContain('roadmap_item_id');
  });

  it('no longer accepts client event ids or percentages', async () => {
    const errors = await errorsFor({
      roadmap_item_id: 'item-1',
      completed: true,
      event_id: '606811fe-8c13-4ee5-a91c-c9a7ef66d13a',
      percentage: 100,
    });
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['event_id', 'percentage']),
    );
  });

  it('accepts a lesson report that marks or unmarks a lesson', async () => {
    for (const completed of [true, false])
      expect(
        await errorsFor({
          roadmap_item_id: 'item-1',
          lesson_id: 'l1',
          completed,
        }),
      ).toHaveLength(0);
  });

  it('rejects a non-boolean completed value', async () => {
    const errors = await errorsFor({
      roadmap_item_id: 'item-1',
      completed: 'yes',
    });
    expect(errors.map((error) => error.property)).toContain('completed');
  });

  it('rejects a submission that is not valid JSON', async () => {
    const errors = await errorsFor({
      roadmap_item_id: 'item-1',
      submission: '{not json',
    });
    expect(errors.map((error) => error.property)).toContain('submission');
  });
});
