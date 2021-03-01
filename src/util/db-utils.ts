import { Client } from 'pg';

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

  const port = process.env['DB_PORT'] ? parseInt(process.env['DB_PORT']) : 5432;
  return createClientAndConnect({
    username: process.env['DB_USERNAME'] || 'postgres',
    host: process.env['DB_HOST'] || 'localhost',
    password: process.env['DB_PASSWORD'] || 'postgres',
    port,
  });
}
