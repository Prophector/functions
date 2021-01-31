import fs from 'fs';
import { Client } from 'pg';
import { withDb } from '../util/db-utils';

export async function migrate(event: any): Promise<string> {
  return withDb((client) => runDatabaseMigrations(client, event));
}

async function runDatabaseMigrations(client: Client, event: any): Promise<void> {
  if(event && event.type === 'hardreset') {
    console.log('Clearing database schema');
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
  }

  const tables = (
    await client.query(
      'select * from information_schema.tables ' +
        "where table_schema = 'public' and table_name = 'pro_migrations'",
    )
  ).rows;
  if (tables.length === 0) {
    console.log('Creating "pro_migrations" table');
    await client.query(
      'create table pro_migrations (' +
        'id serial not null constraint pro_migrations_pk primary key, ' +
        'filename varchar(200) not null)',
    );
  }

  const migrations = fs.readdirSync(`${__dirname}/../../migrations`);
  migrations.sort();
  const appliedMigrations = (
    await client.query('select * from pro_migrations order by filename')
  ).rows.map((m) => m.filename);

  const migrationsPending = migrations.filter((mig) => !appliedMigrations.includes(mig));
  console.log('Migrations pending:', migrationsPending);

  for (let migration of migrationsPending) {
    console.log(`Applying migration ${migration}`);
    const migrationSql = fs.readFileSync(`${__dirname}/../../migrations/${migration}`).toString();
    await client.query(migrationSql);
    await client.query(`insert into pro_migrations (filename) values ('${migration}')`);
  }
}
