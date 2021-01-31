import fetch from 'node-fetch';
import { uploadToS3 } from '../util/s3-utils';

const bucket = 'prophector-scrape-raw';

export async function worldOwidScrape(): Promise<'success'> {
  const data = await fetch(
    'https://covid.ourworldindata.org/data/owid-covid-data.json',
  ).then((response) => response.json());

  const objectKey = `world/owid/owid-covid-data.json`;

  await uploadToS3(bucket, objectKey, data);
  return 'success';
}
