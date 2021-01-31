import fetch from 'node-fetch';
import { uploadToS3 } from '../util/s3-utils';

const bucket = 'prophector-scrape-raw';

export async function chBagScrape(): Promise<'success'> {
  const context = await fetch('https://www.covid19.admin.ch/api/data/context').then((response) =>
    response.json(),
  );

  const dailyLinks = context.sources.individual.json.daily;
  await Promise.all([
    scrapeFile(dailyLinks.cases),
    scrapeFile(dailyLinks.hosp),
    scrapeFile(dailyLinks.death),
    scrapeFile(dailyLinks.test),
    scrapeFile(dailyLinks.testPcrAntigen),
  ]);

  console.log('Successful');
  return 'success';
}

async function scrapeFile(uri: string): Promise<void> {
  console.log(`Downloading ${uri}`);

  const json = await fetch(uri).then((response) => response.json());

  let filename = uri.substring(uri.lastIndexOf('/') + 1);
  const objectKey = `ch/bag/${filename}`;

  await uploadToS3(bucket, objectKey, json);
}
