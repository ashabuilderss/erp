import { BadRequestException } from '@nestjs/common';
import { FilePolicyService } from './file-policy.service';

describe('FilePolicyService', () => {
  const service = new FilePolicyService();

  it('allows Phase 9 approved file types up to 25MB', () => {
    const result = service.validate({
      originalname: 'site-plan.dwg',
      mimetype: 'application/acad',
      size: 25 * 1024 * 1024,
    });

    expect(result).toEqual({
      extension: 'dwg',
      maxSizeBytes: 25 * 1024 * 1024,
      allowed: true,
    });
  });

  it('rejects files larger than 25MB', () => {
    expect(() =>
      service.validate({
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 25 * 1024 * 1024 + 1,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects unapproved extensions even when the mimetype is common', () => {
    expect(() =>
      service.validate({
        originalname: 'script.js',
        mimetype: 'application/javascript',
        size: 128,
      }),
    ).toThrow(BadRequestException);
  });
});
