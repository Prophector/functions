import { Client } from 'pg';
import { withDb } from '../util/db-utils';

export async function execute(event: { query: string }): Promise<string> {
  return withDb((client) => runSql(client, event.query));
}

async function runSql(client: Client, query: string): Promise<void> {
  console.log(`Running query:\n${query}`);
  console.log((await client.query(query)).rows);
}
