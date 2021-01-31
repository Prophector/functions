import { Client, Submittable } from 'pg';
import { getSecret } from './secret-utils';

export async function withDb(fn: (client: Client) => Promise<unknown>): Promise<string> {
  let databaseClient: Client;

  return connect()
    .then((client) => {
      databaseClient = client;
      return fn(client);
    })
    .then(() => 'success')
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => {
      if (databaseClient) {
        console.log('Closing database client...');
        databaseClient.end().finally(() => {
          console.log('Done');
        });
      }
    });
}

export function connect(): Promise<Client> {
  function createClientAndConnect(connectionParams: {
    username: string;
    host: string;
    password: string;
    port: number;
  }) {
    console.log(`Connecting to database host ${connectionParams.host}...`);

    const client = new Client({
      user: connectionParams.username,
      host: connectionParams.host,
      password: connectionParams.password,
      port: connectionParams.port,
      database: 'postgres',
    });

    return client.connect().then(() => client);
  }

  if (process.env.LAMBDA_OFF) {
    return createClientAndConnect({
      username: 'postgres',
      host: 'localhost',
      password: 'postgres',
      port: 5432,
    });
  }

  return getSecret('prod/prophector-data').then((connectionParams) =>
    createClientAndConnect(connectionParams),
  );
}
