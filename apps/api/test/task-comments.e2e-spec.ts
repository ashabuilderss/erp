import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('Task comments e2e', () => {
  let ctx: E2eContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and lists task comments', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'task-comm');
    const token = await login(app, fixture.user.email, fixture.password);

    const prop = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Assignment Test Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 500000,
        location: 'Test',
        city: 'Test',
        state: 'Test',
      })
      .expect(201);

    const assignment = await request(app.getHttpServer())
      .post('/api/assignments')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        type: 'PROPERTY',
        entityId: prop.body.id,
        startDate: new Date().toISOString(),
      })
      .expect(201);

    const publicComment = await request(app.getHttpServer())
      .post('/api/task-comments')
      .set(authHeader(token))
      .send({
        assignmentId: assignment.body.id,
        content: 'Public comment',
      })
      .expect(201);

    expect(publicComment.body.content).toBe('Public comment');
    expect(publicComment.body.isPrivate).toBe(false);

    const privateComment = await request(app.getHttpServer())
      .post('/api/task-comments')
      .set(authHeader(token))
      .send({
        assignmentId: assignment.body.id,
        content: 'Private note',
        isPrivate: true,
      })
      .expect(201);

    expect(privateComment.body.content).toBe('Private note');
    expect(privateComment.body.isPrivate).toBe(true);

    const list = await request(app.getHttpServer())
      .get(`/api/task-comments/assignment/${assignment.body.id}`)
      .set(authHeader(token))
      .expect(200);

    const comments = Array.isArray(list.body) ? list.body : list.body.data;
    expect(comments).toHaveLength(2);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('deletes own comment', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'task-comm');
    const token = await login(app, fixture.user.email, fixture.password);

    const prop = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Delete Test Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 500000,
        location: 'Test',
        city: 'Test',
        state: 'Test',
      })
      .expect(201);

    const assignment = await request(app.getHttpServer())
      .post('/api/assignments')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        type: 'PROPERTY',
        entityId: prop.body.id,
        startDate: new Date().toISOString(),
      })
      .expect(201);

    const publicComment = await request(app.getHttpServer())
      .post('/api/task-comments')
      .set(authHeader(token))
      .send({
        assignmentId: assignment.body.id,
        content: 'Comment to delete',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/task-comments')
      .set(authHeader(token))
      .send({
        assignmentId: assignment.body.id,
        content: 'Private to keep',
        isPrivate: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/task-comments/${publicComment.body.id}`)
      .set(authHeader(token))
      .expect(200);

    const list = await request(app.getHttpServer())
      .get(`/api/task-comments/assignment/${assignment.body.id}`)
      .set(authHeader(token))
      .expect(200);

    const comments = Array.isArray(list.body) ? list.body : list.body.data;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Private to keep');
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('admin sees private comments', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'task-comm');
    const token = await login(app, fixture.user.email, fixture.password);

    const prop = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Admin Test Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 500000,
        location: 'Test',
        city: 'Test',
        state: 'Test',
      })
      .expect(201);

    const assignment = await request(app.getHttpServer())
      .post('/api/assignments')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        type: 'PROPERTY',
        entityId: prop.body.id,
        startDate: new Date().toISOString(),
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/task-comments')
      .set(authHeader(token))
      .send({
        assignmentId: assignment.body.id,
        content: 'Public for admin',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/task-comments')
      .set(authHeader(token))
      .send({
        assignmentId: assignment.body.id,
        content: 'Private for admin',
        isPrivate: true,
      })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/task-comments/assignment/${assignment.body.id}`)
      .set(authHeader(token))
      .expect(200);

    const comments = Array.isArray(list.body) ? list.body : list.body.data;
    expect(comments).toHaveLength(2);

    const publicComment = comments.find(
      (c: { content: string }) => c.content === 'Public for admin',
    );
    const privateComment = comments.find(
      (c: { content: string }) => c.content === 'Private for admin',
    );

    expect(publicComment).toBeDefined();
    expect(privateComment).toBeDefined();
    expect(privateComment!.isPrivate).toBe(true);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });
});
