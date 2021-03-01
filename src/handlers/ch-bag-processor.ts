import { withDb } from '../util/db-utils';
import { Client } from 'pg';
import { readFromS3 } from '../util/s3-utils';

export function chBagProcessor(): Promise<string> {
  return withDb(processData);
}

async function processData(client: Client): Promise<void> {
  const countryId = await createCountry(client);
  const types: [DatumType, VariantType][] = [
    ['Cases', ''],
    ['Death', ''],
    ['Hosp', ''],
    ['Test', '_all'],
  ];
  for (const [type, variant] of types) {
    const jsonData = await readInputData(type, variant);
    console.log(`Start updating ${type}`);

    jsonData
      .sort((a, b) => a.datum?.localeCompare(b.datum))
      .forEach((datum, i, self) => {
        if (i > 0) {
          datum.sumTotal = Math.max(datum.sumTotal || 0, self[i - 1].sumTotal || 0);
        }
      });

    const counter = { count: 0, totalRecords: jsonData.length };
    await Promise.all(
      jsonData.map((jsonDatum) =>
        createOrUpdateDataPoint(client, jsonDatum, type, countryId, counter),
      ),
    );
    console.log(`Finished updating ${counter.count} ${type} data points`);
  }
}

async function readInputData(type: DatumType, variant: VariantType = ''): Promise<ChBagDatum[]> {
  const filename = `ch/bag/COVID19${type}_geoRegion${variant}.json`;
  return readFromS3('prophector-scrape-raw', filename);
}

async function createCountry(client: Client): Promise<number> {
  await client.query(
    "INSERT INTO pro_country (continent_id, name) SELECT id, 'Switzerland' from pro_continent where name = 'Europe'" +
      ' ON CONFLICT DO NOTHING',
  );
  const countryResult = await client.query("SELECT id from pro_country where name = 'Switzerland'");
  return countryResult.rows[0].id;
}

async function createOrUpdateDataPoint(
  client: Client,
  datum: ChBagDatum,
  type: DatumType,
  countryId: number,
  counter: { count: number; totalRecords: number },
) {
  if (!datum.datum) {
    return;
  }
  const mainRegion = datum.geoRegion === 'CH';
  const region = mainRegion ? 'CHE' : datum.geoRegion;
  await client.query(`INSERT INTO pro_datapoint (date, country_id, region, data_source, main_region, cases, deaths, hospitalizations, tests, vaccinations) 
VALUES ('${datum.datum}', ${countryId}, '${region}', 'CH-BAG', ${mainRegion}, null, null, null, null, null) ON CONFLICT DO NOTHING`);

  await client.query(`UPDATE pro_datapoint SET 
    ${getTypeCol(type)} = ${datum.sumTotal || 0}, data_source = 'CH-BAG'
    WHERE date = '${datum.datum}' AND country_id = ${countryId} AND region = '${region}'`);
  counter.count++;
  if (counter.count % 500 === 0) {
    console.log(`Updated ${counter.count} ${type} records of ${counter.totalRecords}`);
  }
}

function getTypeCol(
  type: 'Cases' | 'Death' | 'Hosp' | 'Test',
): 'cases' | 'deaths' | 'hospitalizations' | 'tests' {
  switch (type) {
    case 'Cases':
      return 'cases';
    case 'Death':
      return 'deaths';
    case 'Hosp':
      return 'hospitalizations';
    case 'Test':
      return 'tests';
    default:
      throw new Error(`Type ${type} not implemented`);
  }
}

type DatumType = 'Cases' | 'Death' | 'Hosp' | 'Test';
type VariantType = '' | '_all';

interface ChBagDatum {
  geoRegion: 'CH';
  datum: string;
  entries: number;
  sumTotal?: number;
  timeframe_7d: boolean;
  offset_last7d: number;
  sumTotal_last7d: number;
  timeframe_14d: boolean;
  offset_last14d: number;
  sumTotal_last14d: number;
  timeframe_28d: boolean;
  offset_last28d: number;
  sumTotal_last28d: number;
  timeframe_phase2: boolean;
  offset_Phase2: number;
  sumTotal_Phase2: number;
  timeframe_phase2b: boolean;
  offset_Phase2b: number;
  sumTotal_Phase2b: number;
  timeframe_all: boolean;
  entries_diff_last_age: number;
  pop: number;
  inz_entries: number;
  inzsumTotal: number;
  type: 'COVID19Cases';
  type_variant: '';
  version: string;
  datum_unit: 'day';
  entries_letzter_stand: number;
  entries_neu_gemeldet: number;
  entries_diff_last: number;
}
