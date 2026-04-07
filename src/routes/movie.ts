import express, { Request, Response, NextFunction } from "express";
import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";
import { Movie, MovieAttributes } from "../models.js";

const router = express.Router();

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

    res.status(200).json({ movies: [movie] });
  } catch (error: any) {
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
  } catch (error: any) {
    next(error);
  }
});

// Helper Functions
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

export default router;