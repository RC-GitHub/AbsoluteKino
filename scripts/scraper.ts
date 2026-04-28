import sequelize, { Movie, MovieAttributes, MovieInstance } from "../src/models";
import * as Constants from "../src/constants";

const limitArg = process.argv[2];
const MOVIE_LIMIT = limitArg ? parseInt(limitArg, 10) : 10;

const BASE_URL = "https://www.cinema-city.pl/pl/data-api-service/v1/feed/10103/byName/now-playing?lang=pl_PL";
const DETAILS_URL = "https://www.cinema-city.pl/pl/data-api-service/v1/10103/films/byDistributorCode/";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllCodes() {
    const response = await fetch(BASE_URL);
    const data = await response.json();
    const links = data.body.posters.map((poster: any) => poster.code);
    return links;
}

async function mapDetailsToMovie(code: string) {
    const response = await fetch(`${DETAILS_URL}${code}`);
    const data = await response.json();
    const details = data.body.filmDetails;

    let language = details.originalLanguage[0]?.split("-") || "PL";
    language = language === "PL" ? "PL" : language[language.length - 1];

    let premiereDate = details.releaseYear.includes(',') ? new Date(details.releaseYear.split(',')[details.releaseYear.split(',').length - 1].trim()) : new Date(`${details.releaseYear}-01-01`);

    const movie: MovieAttributes = {
        title: details.name,
        viewingFormat: details.screeningAttributes?.join(", ") || Constants.MOVIE_STD_VIEWING_FORMATS[0],
        duration: details.length,
        description: details.synopsis,
        posterUrl: details.posterLinkLarge,
        trailerUrl: details.videoLink,
        language: language.toUpperCase(),
        premiereDate: premiereDate,
        genre: details.categoriesAttributes?.join(", "),
        restrictions: details.ageRestrictionName || Constants.MOVIE_AGE_RESTRICTIONS[2],
        cast: details.cast,
        directors: details.directors,
    };
    console.log(movie);

    return movie;
}

async function runScraper() {
    try {
        await sequelize.authenticate();
        let allCodes = await fetchAllCodes();

        if (MOVIE_LIMIT && !isNaN(MOVIE_LIMIT)) {
            console.log(`[CLI] Limiting fetch to ${MOVIE_LIMIT} movies.`);
            allCodes = allCodes.slice(0, MOVIE_LIMIT);
        }

        const existingMovies = await Movie.findAll({
            attributes: ['title'],
            raw: true
        });
        const existingTitles = existingMovies.map(m => m.title);

        const moviesToInsert: MovieAttributes[] = [];

        for (const code of allCodes) {
            const movieData = await mapDetailsToMovie(code);

            if (!existingTitles.includes(movieData.title)) {
                moviesToInsert.push(movieData);
                existingTitles.push(movieData.title);
            }

            await sleep(Math.max(1000, Math.random() * 3000));
        }

        if (moviesToInsert.length > 0) {
            await Movie.bulkCreate(moviesToInsert);
            console.log(`[CLI] Added ${moviesToInsert.length} new movies.`);
        } else {
            console.log("[CLI] Database is up to date, no new movies.");
        }
    }
    catch (error: any) {
        console.error('[CLI] Scraper error:', error);
    } finally {
        await sequelize.close();
    }
}

runScraper();
