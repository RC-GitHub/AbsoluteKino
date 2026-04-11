import { Movie, MovieAttributes, MovieInstance } from "../models.js";
import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";

const router = express.Router();

function isViewingFormatCorrect(viewingFormat: string): boolean {
  const viewingFormats: string[] = viewingFormat.split(" ");
  return viewingFormats.every((format) => Constants.MOVIE_STD_VIEWING_FORMATS.includes(format));
}

function isValidURL(url: string): boolean {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return !!pattern.test(url);
}

// Adds a new movie to the database
// Requires: title, viewing format, duration, description, poster url, 
// trailer url, language, premiere date, genre, restrictions, cast and director
router.post("/new", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      viewingFormat,
      duration,
      description,
      posterUrl,
      trailerUrl,
      language,
      premiereDate,
      genre,
      restrictions,
      cast,
      director,
    }: MovieAttributes = req.body;

    if (
      title == null || viewingFormat == null || duration == null || 
      description == null || posterUrl == null || trailerUrl == null || 
      language == null || premiereDate == null || genre == null || 
      restrictions == null || cast == null || director == null
    ) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
    }

    const parsedDate = new Date(premiereDate);
    
    if (
      typeof title !== "string" ||
      typeof viewingFormat !== "string" ||
      typeof duration !== "number" ||
      !Number.isInteger(duration) ||
      typeof description !== "string" ||
      typeof posterUrl !== "string" ||
      typeof trailerUrl !== "string" ||
      typeof language !== "string" ||
      isNaN(parsedDate.getTime()) || 
      typeof genre !== "string" ||
      typeof restrictions !== "string" ||
      typeof cast !== "string" ||
      typeof director !== "string"
    ) {
      return res.status(400).json({ message: Messages.ROOM_ERR_TYPING, movies: [] });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < Constants.MOVIE_TITLE_MIN_LEN || trimmedTitle.length > Constants.MOVIE_TITLE_MAX_LEN) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });
    }

    if (!isViewingFormatCorrect(viewingFormat)) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_VIEWING_FORMAT, movies: [] });
    }

    if (duration < Constants.MOVIE_DUR_MIN || duration > Constants.MOVIE_DUR_MAX) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_DURATION, movies: [] });
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < Constants.MOVIE_DESC_MIN_LEN || trimmedDesc.length > Constants.MOVIE_DESC_MAX_LEN) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_DESC, movies: [] });
    }

    if (!isValidURL(posterUrl)) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_POSTER_URL, movies: [] });
    }

    if (!isValidURL(trailerUrl)) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_TRAILER_URL, movies: [] });
    }

    const trimmedLang = language.trim();
    if (trimmedLang.length < Constants.MOVIE_LANG_MIN_LEN || trimmedLang.length > Constants.MOVIE_LANG_MAX_LEN) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });
    }

    if (isNaN(parsedDate.getTime()) || parsedDate.toISOString() === "Invalid Date") {
      return res.status(400).json({ message: Messages.MOVIE_ERR_PREMIERE_DATE, movies: [] });
    }
    if (!(premiereDate as unknown as string).includes(parsedDate.toISOString().substring(0, 10))) {
       return res.status(400).json({ message: Messages.MOVIE_ERR_PREMIERE_DATE, movies: [] });
    }

    const validRestrictions = Constants.MOVIE_AGE_RESTRICTIONS as readonly string[];
    if (!validRestrictions.includes(restrictions)) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_RESTRICTIONS, movies: [] });
    }

    const trimmedGenre = genre.trim();
    if (trimmedGenre.length < Constants.MOVIE_GENRE_MIN_LEN || trimmedGenre.length > Constants.MOVIE_GENRE_MAX_LEN) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });
    }

    const trimmedCast = cast.trim();
    if (trimmedCast.length < Constants.MOVIE_CAST_MIN_LEN || trimmedCast.length > Constants.MOVIE_CAST_MAX_LEN) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });
    }

    const trimmedDir = director.trim();
    if (trimmedDir.length < Constants.MOVIE_DIR_MIN_LEN || trimmedDir.length > Constants.MOVIE_DIR_MAX_LEN) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });
    }

    const movie = await Movie.create({
      title: trimmedTitle,
      viewingFormat,
      duration,
      description: trimmedDesc,
      posterUrl,
      trailerUrl,
      language: trimmedLang,
      premiereDate: parsedDate,
      genre: trimmedGenre,
      restrictions,
      cast: trimmedCast,
      director: trimmedDir,
    });

    res.send({ movies: [movie] });
  } 
  catch (error: any) {
    next(error);
  }
});

// Sends data about all movies in the database
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movies: MovieInstance[] = await Movie.findAll();
    if (movies.length === 0) {
      return res.status(404).json({ message: Messages.MOVIE_ERR_NOT_FOUND_ALL, movies: [] });
    }
    res.send({ movies: movies });
  } 
  catch (error: any) {
    next(error);
  }
});

// Sends data about a movie with the specified ID
router.get("/id/:movieId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movieId: number = parseInt(req.params.movieId.toString());
    if (isNaN(movieId) || movieId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_ID, movies: [] });
    }
    
    const movie: MovieInstance | null = await Movie.findByPk(movieId);
    if (!movie) {
      return res.status(404).json({ message: Messages.MOVIE_ERR_NOT_FOUND, movies: [] });
    }
    res.send({ movies: [movie] });
  } 
  catch (error: any) {
    next(error);
  }
});

// Updates data for a movie with the specified ID
router.put("/update/:movieId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movieId: number = parseInt(req.params.movieId.toString());
    if (isNaN(movieId) || movieId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_ID, movies: [] });
    }

    const movie: MovieInstance | null = await Movie.findByPk(movieId);
    if (!movie) {
      return res.status(404).json({ message: Messages.MOVIE_ERR_NOT_FOUND, movies: [] });
    }

    const {
      title,
      viewingFormat,
      duration,
      description,
      posterUrl,
      trailerUrl,
      language,
      premiereDate,
      genre,
      restrictions,
      cast,
      director,
    } = req.body;

    if (
      title == null && viewingFormat == null && duration == null &&
      description == null && posterUrl == null && trailerUrl == null &&
      language == null && premiereDate == null && genre == null &&
      restrictions == null && cast == null && director == null
    ) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_EMPTY_ARGS, movies: [] });
    }

    const updateData: Partial<MovieAttributes> = {};

    if (title !== undefined) {
      if (typeof title !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const trimmedTitle = title.trim();
      if (trimmedTitle.length < Constants.MOVIE_TITLE_MIN_LEN || trimmedTitle.length > Constants.MOVIE_TITLE_MAX_LEN) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_TITLE_LEN, movies: [] });
      }
      updateData.title = trimmedTitle;
    }

    if (duration !== undefined) {
      if (typeof duration !== 'number' || !Number.isInteger(duration)) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      }
      if (duration < Constants.MOVIE_DUR_MIN || duration > Constants.MOVIE_DUR_MAX) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_DURATION, movies: [] });
      }
      updateData.duration = duration;
    }

    if (viewingFormat !== undefined) {
      if (typeof viewingFormat !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      if (!isViewingFormatCorrect(viewingFormat)) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_VIEWING_FORMAT, movies: [] });
      }
      updateData.viewingFormat = viewingFormat;
    }

    if (description !== undefined) {
      if (typeof description !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const trimmedDesc = description.trim();
      if (trimmedDesc.length < Constants.MOVIE_DESC_MIN_LEN || trimmedDesc.length > Constants.MOVIE_DESC_MAX_LEN) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_DESC, movies: [] });
      }
      updateData.description = trimmedDesc;
    }

    if (posterUrl !== undefined) {
      if (typeof posterUrl !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      if (!isValidURL(posterUrl)) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_POSTER_URL, movies: [] });
      }
      updateData.posterUrl = posterUrl;
    }

    if (trailerUrl !== undefined) {
      if (typeof trailerUrl !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      if (!isValidURL(trailerUrl)) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_TRAILER_URL, movies: [] });
      }
      updateData.trailerUrl = trailerUrl;
    }

    if (premiereDate !== undefined) {
      if (typeof premiereDate !== "string") {
        return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      }

      const parsedDate = new Date(premiereDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_PREMIERE_DATE, movies: [] });
      }

      const inputDatePart = premiereDate.substring(0, 10);
      const outputDatePart = parsedDate.toISOString().substring(0, 10);

      if (inputDatePart !== outputDatePart) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_PREMIERE_DATE, movies: [] });
      }
      updateData.premiereDate = parsedDate;
    }

    if (language !== undefined) {
      if (typeof language !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const trimmed = language.trim();
      if (trimmed.length < Constants.MOVIE_LANG_MIN_LEN || trimmed.length > Constants.MOVIE_LANG_MAX_LEN) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_LANG_LEN, movies: [] });
      }
      updateData.language = trimmed;
    }

    if (genre !== undefined) {
      if (typeof genre !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const trimmed = genre.trim();
      if (trimmed.length < Constants.MOVIE_GENRE_MIN_LEN || trimmed.length > Constants.MOVIE_GENRE_MAX_LEN) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_GENRE_LEN, movies: [] });
      }
      updateData.genre = trimmed;
    }

    if (cast !== undefined) {
      if (typeof cast !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const trimmed = cast.trim();
      if (trimmed.length < Constants.MOVIE_CAST_MIN_LEN || trimmed.length > Constants.MOVIE_CAST_MAX_LEN) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_CAST_LEN, movies: [] });
      }
      updateData.cast = trimmed;
    }

    if (director !== undefined) {
      if (typeof director !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const trimmed = director.trim();
      if (trimmed.length < Constants.MOVIE_DIR_MIN_LEN || trimmed.length > Constants.MOVIE_DIR_MAX_LEN) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_DIR_LEN, movies: [] });
      }
      updateData.director = trimmed;
    }

    if (restrictions !== undefined) {
      if (typeof restrictions !== 'string') return res.status(400).json({ message: Messages.MOVIE_ERR_TYPING, movies: [] });
      const validRestrictions = Constants.MOVIE_AGE_RESTRICTIONS as readonly string[]
      if (!validRestrictions.includes(restrictions)) {
        return res.status(400).json({ message: Messages.MOVIE_ERR_RESTRICTIONS, movies: [] });
      }
      updateData.restrictions = restrictions;
    }

    await movie.update(updateData);
    res.send({ movies: [movie] });
  } 
  catch (error: any) {
    next(error);
  }
});

// Deletes a movie with the specified ID
router.delete("/delete/:movieId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movieId: number = parseInt(req.params.movieId.toString());
    if (isNaN(movieId) || movieId < Constants.TYPICAL_MIN_ID) {
      return res.status(400).json({ message: Messages.MOVIE_ERR_ID });
    }

    const deletedRows: number = await Movie.destroy({
      where: { id: movieId },
    });
    if (deletedRows === 0) {
      return res.status(404).json({ message: Messages.MOVIE_ERR_NOT_FOUND });
    }

    res.status(200).json({ message: Messages.MOVIE_MSG_DEL });
  } 
  catch (error: any) {
    next(error);
  }
});

export default router;