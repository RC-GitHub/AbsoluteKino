import { Room, User, UserInstance, Seat, Screening, Product, Reservation } from "../models";
import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import { CONFIG } from "../config";
import * as Messages from "../messages";
import * as Constants from "../constants";

const JWT_SECRET: string = CONFIG.JWT_SECRET;

export const createUserToken = (user: UserInstance) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      accountType: user.accountType,
      tokenVersion: user.tokenVersion,
      loginTime: new Date().getTime(),
    },
    CONFIG.JWT_SECRET,
    { expiresIn: Constants.USER_COOKIE_EXPIRES_IN },
  );
};

export const createUserTokenOptions = (
  httpOnly: boolean = true,
  secure: boolean = process.env.NODE_ENV === "production",
  sameSite: boolean | "strict" | "lax" | "none" | undefined = "strict",
  maxAge: number = Constants.USER_COOKIE_MAX_AGE,
) => {
  return {
    httpOnly,
    secure,
    sameSite,
    maxAge,
  };
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as any;
};

export const authorize = (arrayName: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;
    const errorResponse: any = { message: Messages.AUTH_REQUIRED };

    if (req.method !== "DELETE") {
      const names = Array.isArray(arrayName) ? arrayName : [arrayName];
      names.forEach((name) => (errorResponse[name] = []));
    }

    if (!token) return res.status(401).json(errorResponse);

    try {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id);

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        res.clearCookie("auth_token");
        errorResponse.message = Messages.AUTH_SESSION;
        return res.status(401).json(errorResponse);
      }

      (req as any).user = user;
      next();
    } catch (error: any) {
      res.clearCookie("auth_token");
      errorResponse.message = Messages.AUTH_SESSION;

      return res.status(401).json(errorResponse);
    }
  };
};

export const validatePrivileges = (
  arrayName: string | string[],
  minRequiredLevel: number,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: Messages.AUTH_REQUIRED });
    }

    const userLevel = Constants.USER_ACC_TYPES.indexOf(user.accountType);

    if (userLevel < minRequiredLevel) {
      const response: any = { message: Messages.AUTH_FORBIDDEN };
      if (req.method !== "DELETE") {
        const names = Array.isArray(arrayName) ? arrayName : [arrayName];
        names.forEach((name) => (response[name] = []));
      }
      return res.status(403).json(response);
    }

    next();
  };
};

export const validateOwnership = (
  arrayName: string | string[],
  bypassLevel: number = 3,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const userId = parseInt(req.params.userId || req.body.userId);

      const sendAuthError = (status: number, message: string) => {
        const response: any = { message };
        if (req.method !== "DELETE") {
          const names = Array.isArray(arrayName) ? arrayName : [arrayName];
          names.forEach((name) => (response[name] = []));
        }
        return res.status(status).json(response);
      };

      if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
        return sendAuthError(400, Messages.USER_ERR_ID);
      }

      if (!user || !user.id) {
        return sendAuthError(401, Messages.AUTH_REQUIRED);
      }

      const isOwner = user.id === userId;
      const userLevel = Constants.USER_ACC_TYPES.indexOf(
        user.accountType || "",
      );
      const hasBypass = userLevel >= bypassLevel;

      if (!isOwner && !hasBypass)
        return sendAuthError(403, Messages.AUTH_FORBIDDEN);

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

/**
 * Verifies if the authenticated user has administrative rights over a specific cinema.
 * Can take cinemaId from params or body.
 */
export const validateCinemaMembership = (
  arrayName: string | string[],
  bypassLevel: number = 3,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const cinemaId = parseInt(
        req.params.cinemaId || req.body.cinemaId || req.query.cinemaId,
      );

      const errorResponse: any = { message: "" };
      const names = Array.isArray(arrayName) ? arrayName : [arrayName];
      if (req.method !== "DELETE")
        names.forEach((name) => (errorResponse[name] = []));

      if (isNaN(cinemaId) || cinemaId < Constants.TYPICAL_MIN_ID) {
        errorResponse.message = Messages.CINEMA_ERR_ID;
        return res.status(400).json(errorResponse);
      }

      if (!user) {
        errorResponse.message = Messages.AUTH_REQUIRED;
        return res.status(401).json(errorResponse);
      }

      const userLevel = Constants.USER_ACC_TYPES.indexOf(
        user.accountType || "",
      );
      if (userLevel >= bypassLevel) return next();

      const hasAccess = await (user as any).hasCinema(cinemaId);
      if (!hasAccess) {
        errorResponse.message = Messages.AUTH_FORBIDDEN;
        return res.status(403).json(errorResponse);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  };
};

const validateCinemaResourceAccess = (
  Model: any,
  resourceIdKey: string,
  idErrorMessage: string,
  notFoundMessage: string,
  arrayName: string | string[],
  bypassLevel: number = 3
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const resourceId = parseInt(req.params[resourceIdKey] || req.body[resourceIdKey] || req.query[resourceIdKey]);

      const errorResponse: any = { message: "" };
      const names = Array.isArray(arrayName) ? arrayName : [arrayName];
      if (req.method !== "DELETE") names.forEach((n) => (errorResponse[n] = []));

      if (isNaN(resourceId) || resourceId < Constants.TYPICAL_MIN_ID) {
        return res.status(400).json({ ...errorResponse, message: idErrorMessage });
      }

      if (!user) return res.status(401).json({ ...errorResponse, message: Messages.AUTH_REQUIRED });

      const record = await Model.findByPk(resourceId);
      if (!record) return res.status(404).json({ ...errorResponse, message: notFoundMessage });

      const userLevel = Constants.USER_ACC_TYPES.indexOf(user.accountType || "");
      if (userLevel >= bypassLevel) return next();

      const hasAccess = await (user as any).hasCinema(record.cinemaId);
      if (!hasAccess) return res.status(403).json({ ...errorResponse, message: Messages.AUTH_FORBIDDEN });

      next();
    }
    catch (error: any) {
        next(error);
    }
  };
};

export const validateRoomAccess = (arr: string | string[], level: number) =>
  validateCinemaResourceAccess(Room, "roomId", Messages.ROOM_ERR_ID, Messages.ROOM_ERR_NOT_FOUND_GLOBAL, arr, level);

export const validateProductAccess = (arr: string | string[], level: number) =>
  validateCinemaResourceAccess(Product, "productId", Messages.PRODUCT_ERR_ID, Messages.PRODUCT_ERR_NOT_FOUND, arr, level);

const validateRoomLinkedAccess = (
  Model: any,
  resourceIdKey: string,      // e.g., "seatId" or "screeningId"
  arrayNames: string | string[], // e.g., ["seats", "otherData"]
  notFoundMessage: string,
  idErrorMessage: string,
  bypassLevel: number = 3
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const resourceId = parseInt(
        req.params[resourceIdKey] || req.body[resourceIdKey] || req.query[resourceIdKey]
      );

      const errorResponse: any = { message: "" };
      const names = Array.isArray(arrayNames) ? arrayNames : [arrayNames];

      if (req.method !== "DELETE") {
        names.forEach((name) => (errorResponse[name] = []));
      }

      if (isNaN(resourceId) || resourceId < Constants.TYPICAL_MIN_ID) {
        errorResponse.message = idErrorMessage;
        return res.status(400).json(errorResponse);
      }

      if (!user) {
        errorResponse.message = Messages.AUTH_REQUIRED;
        return res.status(401).json(errorResponse);
      }

      const userLevel = Constants.USER_ACC_TYPES.indexOf(user.accountType || "");
      if (userLevel >= bypassLevel) return next();

      const record = await Model.findByPk(resourceId, {
        include: [{ model: Room, as: "Room" }]
      });

      if (!record) {
        errorResponse.message = notFoundMessage;
        return res.status(404).json(errorResponse);
      }

      const cinemaId = (record as any).Room?.cinemaId;
      if (!cinemaId) {
        return res.status(500).json({ message: Messages.DB_ERR_ASSOCIATION, ...errorResponse });
      }

      const hasAccess = await (user as any).hasCinema(cinemaId);
      if (!hasAccess) {
        errorResponse.message = Messages.AUTH_FORBIDDEN;
        return res.status(403).json(errorResponse);
      }

      (req as any)[names[0]] = record;
      next();
    }
    catch (error: any) {
      next(error);
    }
  };
};

export const validateSeatAccess = (
  arrayNames: string | string[],
  bypassLevel: number = 3
) => validateRoomLinkedAccess(
  Seat,
  "seatId",
  arrayNames,
  Messages.SEAT_ERR_NOT_FOUND,
  Messages.SEAT_ERR_ID,
  bypassLevel
);

export const validateScreeningAccess = (
  arrayNames: string | string[],
  bypassLevel: number = 3
) => validateRoomLinkedAccess(
  Screening,
  "screeningId",
  arrayNames,
  Messages.SCREENING_ERR_NOT_FOUND_ROOM,
  Messages.SCREENING_ERR_ID,
  bypassLevel
);
