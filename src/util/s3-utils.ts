import AWS from 'aws-sdk';
import fs from 'fs';

const s3 = new AWS.S3();

export async function uploadToS3(
  bucket: string,
  objectKey: string,
  content: unknown,
): Promise<void> {
  if (process.env.LAMBDA_OFF) {
    await fs.promises.writeFile(`${__dirname}/../../scraped/${objectKey}`, JSON.stringify(content));
    return;
  }

  try {
    const destParams = {
      Bucket: bucket,
      Key: objectKey,
      Body: JSON.stringify(content),
    };

    console.log(`Uploading ${objectKey}`);
    await s3.upload(destParams).promise();
  } catch (error) {
    console.error(`Error upload ${objectKey}`, error);
    return;
  }
  console.log(`Finishing uploading ${objectKey}`);
}

export async function readFromS3<T>(bucket:string,filename:string):Promise<T>{
  console.log(`Reading ${filename}`);

  if (process.env.LAMBDA_OFF) {
    const filePath = `${__dirname}/../../scraped/${filename}`;
    return fs.promises
        .readFile(filePath)
        .then((r) => r.toString('utf-8'))
        .then((r) => JSON.parse(r));
  }

  // read from s3
  return s3
      .getObject({ Bucket: bucket, Key: filename })
      .promise()
      .then((r) => r.Body && r.Body.toString('utf-8'))
      .then((r) => (r ? JSON.parse(r) : []));
}
