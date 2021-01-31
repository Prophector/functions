import { Client } from 'pg';
import { readFromS3 } from '../util/s3-utils';
import { withDb } from '../util/db-utils';

export function worldOwidProcessor(): Promise<string> {
  return withDb(processData);
}

async function processData(client: Client): Promise<void> {
  const jsonData = await readFromS3<{ [key: string]: OwidCountry }>(
    'prophector-scrape-raw',
    `world/owid/owid-covid-data.json`,
  );

  for (const countryCode of Object.keys(jsonData)) {
    await createOrUpdateCountry(client, countryCode, jsonData[countryCode]);
  }

  console.log(`Finished updating`);
}

async function createOrUpdateCountry(
  client: Client,
  countryCode: string,
  countryData: OwidCountry,
) {
  console.log(`Updating ${countryData.location}`);

  const countryId = await createCountry(
    client,
    countryData.continent,
    countryData.location,
    countryCode,
    countryData.population,
  );

  // Make sure the timeseries is monotone.
  // Some countries only report their values on a certain week day, while those alone are monotonous,
  // our data source fills the days between with zeroes, which is fixed by this:
  countryData.data
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((dataPoint, i, self) => {
      if (i > 0) {
        const previous = self[i - 1];
        dataPoint.total_cases = Math.max(dataPoint.total_cases || 0, previous.total_cases || 0);
        dataPoint.total_tests = Math.max(dataPoint.total_tests || 0, previous.total_tests || 0);
        dataPoint.total_deaths = Math.max(dataPoint.total_deaths || 0, previous.total_deaths || 0);
        dataPoint.total_vaccinations = Math.max(
          dataPoint.total_vaccinations || 0,
          previous.total_vaccinations || 0,
        );
      }
    });

  await Promise.all(
    countryData.data.map((dataPoint) =>
      createOrUpdateDataPoint(client, countryCode, dataPoint, countryId),
    ),
  );
  console.log(`Finished updating ${countryData.location}`);
}

async function createOrUpdateDataPoint(
  client: Client,
  countryCode: string,
  dataPoint: OwidDataPoint,
  countryId: number,
) {
  await client.query(
    `INSERT INTO pro_datapoint (date, country_id, region, main_region, data_source, cases, deaths,
                                    hospitalizations, tests, vaccinations)
         VALUES ($1, $2, $3, true, 'WORLD-OWID', null, null, null, null, null)
         ON CONFLICT DO NOTHING`,
    [dataPoint.date, countryId, countryCode],
  );

  await client.query(
    `UPDATE pro_datapoint
         SET cases        = $1,
             deaths       = $2,
             tests        = $3,
             vaccinations = $4,
             data_source  = 'WORLD-OWID'
         WHERE date = $5
           AND country_id = $6
           AND main_region = true`,
    [
      dataPoint.total_cases || 0,
      dataPoint.total_deaths || 0,
      dataPoint.total_tests || 0,
      dataPoint.total_vaccinations || 0,
      dataPoint.date,
      countryId,
    ],
  );
}

async function createCountry(
  client: Client,
  continent: string,
  name: string,
  countryCode: string,
  population: number,
): Promise<number> {
  const countryResult = await client.query(
    `SELECT id
         from pro_country
         where name = $1`,
    [name],
  );

  if (countryResult.rows.length === 1) {
    const countryId = countryResult.rows[0].id;
    await client.query(
      `UPDATE pro_country
             set population = $1,
                 iso_code   = $2
             where id = $3`,
      [population, countryCode, countryId],
    );
    return countryId;
  }

  await client.query(
    `INSERT INTO pro_country (continent_id, name, iso_code, population)
         SELECT id, $1, $2, $3
         from pro_continent
         where name = $4`,
    [name, countryCode, population, continent || 'World'],
  );
  const queryResult = await client.query(
    `SELECT id
         from pro_country
         where name = $1`,
    [name],
  );
  if (queryResult.rows.length === 0) {
    console.log(`Could not create country: ${name}, continent: ${continent}, pop: ${population}`);
  }
  return queryResult.rows[0].id;
}

interface OwidCountry {
  continent:
    | 'Asia'
    | 'Africa'
    | 'Europe'
    | 'South America'
    | 'North America'
    | 'Australia'
    | 'Antarctica';
  location: string;
  population: number;
  population_density: number;
  median_age: number;
  aged_65_older: number;
  aged_70_older: number;
  gdp_per_capita: number;
  extreme_poverty: number;
  cardiovasc_death_rate: number;
  diabetes_prevalence: number;
  female_smokers: number;
  male_smokers: number;
  handwashing_facilities: number;
  hospital_beds_per_thousand: number;
  life_expectancy: number;
  human_development_index: number;
  data: OwidDataPoint[];
}

interface OwidDataPoint {
  date: string;
  total_cases: number;
  new_cases: number;
  new_cases_smoothed: number;
  total_deaths: number;
  new_deaths: number;
  new_deaths_smoothed: number;
  total_cases_per_million: number;
  new_cases_per_million: number;
  new_cases_smoothed_per_million: number;
  total_deaths_per_million: number;
  new_deaths_per_million: number;
  new_deaths_smoothed_per_million: number;
  reproduction_rate: number;
  new_tests: number;
  total_tests: number;
  total_tests_per_thousand: number;
  new_tests_per_thousand: number;
  new_tests_smoothed: number;
  new_tests_smoothed_per_thousand: number;
  positive_rate: number;
  tests_per_case: number;
  tests_units: 'tests performed';
  total_vaccinations: number;
  total_vaccinations_per_hundred: number;
  stringency_index: number;
}
