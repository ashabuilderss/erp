import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  expect(response.body.accessToken).toEqual(expect.any(String));
  return response.body.accessToken as string;
  /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
