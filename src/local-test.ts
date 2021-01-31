import {chBagProcessor} from './handlers/ch-bag-processor';
import {migrate} from './handlers/database-migration';
import {chBagScrape} from './handlers/ch-bag-scraper';
import {worldOwidScrape} from "./handlers/world-owid-scraper";
import {worldOwidProcessor} from "./handlers/world-owid-processor";

(async () => {
    const handler = process.argv[2];

    process.env.LAMBDA_OFF = 'true';

    switch (handler) {
        case 'database-migrate':
            await migrate({});
            break;
        case 'ch-bag-processor':
            await chBagProcessor();
            break;
        case 'ch-bag-scraper':
            await chBagScrape();
            break;
        case 'world-owid-processor':
            await worldOwidProcessor();
            break;
        case 'world-owid-scraper':
            await worldOwidScrape();
            break;
        default:
            throw new Error(`Not implemented: ${handler}`);
    }
})();
