import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/client';
import { NotFoundError } from '../../shared/errors';

export async function getUserById(userId: string) {
  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError('User');
  return user;
}

export async function updateUser(
  userId: string,
  input: { name?: string; avatar?: string }
) {
  const [updated] = await getDb()
    .update(schema.users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      avatar: schema.users.avatar,
      createdAt: schema.users.createdAt,
    });

  if (!updated) throw new NotFoundError('User');
  return updated;
}
