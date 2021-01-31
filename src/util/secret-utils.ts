import AWS from 'aws-sdk';

export function getSecret(secretName: string): Promise<any> {
  const region = 'us-east-2';

  // Create a Secrets Manager client
  const client = new AWS.SecretsManager({ region });

  console.log(`Reading secret ${secretName} in region ${region}...`);
  return new Promise((resolve, reject) => {
    client.getSecretValue({ SecretId: secretName }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      if (!data) {
        reject(`Secret was "${data}"`);
        return;
      }

      // Decrypts secret using the associated KMS CMK.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      let secret;
      if ('SecretString' in data && data.SecretString) {
        secret = JSON.parse(data.SecretString);
      } else {
        reject('Secret not supported');
        return;
      }

      console.log('Secret successfully read', typeof secret);
      resolve(secret);
    });
  });
}
