import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { CONFIG } from '../config';
import * as Messages from '../messages'

const JWT_SECRET: string = CONFIG.JWT_SECRET;

export const authorizeAs = (arrayName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.cookies.auth_token;
            if (!token) {
                return res.status(401).json({ message: Messages.AUTH_REQUIRED, [arrayName]: [] });
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                (req as any).user = decoded;
                next();
            } catch (error) {
                res.clearCookie("auth_token");
                return res.status(401).json({ message: Messages.AUTH_SESSION, [arrayName]: [] });
            }

        }
        catch (error: any) {
            next(error);
        }
    };
}