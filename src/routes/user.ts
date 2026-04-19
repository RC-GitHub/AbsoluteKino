import { Op } from 'sequelize';
import bcrypt from "bcryptjs";

import { Cinema, User, UserAttributes, UserInstance } from "../models.js";
import { Request, Response, NextFunction, Router } from "express";

import * as Messages from "../messages";
import * as Constants from "../constants";
import * as Auth from "../middleware/auth.ts"

const router = Router();

const isValidPhone = (phone: string): boolean => {
    const regex = new RegExp(Constants.USER_PHONE_REGEX);
    return regex.test(phone);
};

const isValidEmail = (email: string): boolean => {
    const regex = new RegExp(Constants.USER_EMAIL_REGEX);
    return regex.test(email);
};

export const registerUserLogic = async (data: any) => {
    let { name, password, email, phoneNumber }: UserAttributes = data;

    let isAuthenticated = true;
    if (
        name == null &&
        password == null &&
        email == null &&
        phoneNumber == null
    ) {
        isAuthenticated = false;
    }

    if (isAuthenticated) {
        if (
            name == null || password == null ||
            (email == null && phoneNumber == null)
        ) {
            throw { status: 400, message: Messages.USER_ERR_EMPTY_ARGS };
        }

        if (
            (typeof name !== "string") ||
            (typeof password !== "string") ||
            (email != null && typeof email !== "string") ||
            (phoneNumber != null && typeof phoneNumber !== "string" && typeof phoneNumber !== "number")
        ) {
            throw { status: 400, message: Messages.USER_ERR_TYPING };
        }

        const trimmedName = name.trim();
        if (trimmedName.length < Constants.USER_NAME_MIN_LEN || trimmedName.length > Constants.USER_NAME_MAX_LEN) {
            throw { status: 400, message: Messages.USER_ERR_NAME_LEN };
        }

        let hashedPassword: string | null = null;
        const trimmedPass = password.trim();
        if (trimmedPass.length < Constants.USER_PASS_MIN_LEN || trimmedPass.length > Constants.USER_PASS_MAX_LEN) {
            throw { status: 400, message: Messages.USER_ERR_PASS_LEN };
        }
        hashedPassword = await bcrypt.hash(trimmedPass, Constants.USER_PASS_SALT_ROUNDS);

        if (email != null && !isValidEmail(email as string)) {
            throw { status: 400, message: Messages.USER_ERR_EMAIL };
        }

        let pureDigits: string | null = null;
        if (phoneNumber != null) {
            const rawPhone = phoneNumber.toString().trim();
            if (rawPhone !== "") {
                pureDigits = rawPhone.replace(/\D/g, "");
                if (pureDigits.length === 0 || !isValidPhone(pureDigits)) {
                    throw { status: 400, message: Messages.USER_ERR_PHONE };
                }
            }
        }

        if (email != null) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) throw { status: 400, message: Messages.USER_ERR_EMAIL_UNIQUE };
        }

        if (pureDigits) { 
            const existingPhone = await User.findOne({ where: { phoneNumber: pureDigits } });
            if (existingPhone) throw { status: 400, message: Messages.USER_ERR_PHONE_UNIQUE };
        }

        return User.build({
            name: trimmedName,
            accountType: Constants.USER_ACC_TYPES[1],
            password: hashedPassword,
            email,
            phoneNumber: pureDigits,
        });

    }
    else {
        // Unauthenticated user
        return User.build({
            name: `Guest_${Date.now()}`,
            accountType: Constants.USER_ACC_TYPES[0],
            password,
            email,
            phoneNumber,
        });
    }
}


/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Adds a new user to the database
 * No data is required - then an unauthorized user will be created
 * To create an authorized user, the request must include the name, password, and email or phone number
 * There is no way of creating a cinema admin or site owner via this endpoint
 */
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user: UserInstance = await registerUserLogic(req.body);
        await user.save();

        const token = Auth.createUserToken(user);
        const tokenOptions = Auth.createUserTokenOptions();
        res.cookie("auth_token", token, tokenOptions);

        res.send({ users: [user] });
    }
    catch (error: any) {
        if (error.status) {
            return res.status(error.status).json({
                message: error.message,
                users: [],
            });
        }
        next(error);
    }
});

/** 
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Logs a user in by verifying credentials and setting an auth cookie
 */
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existingToken = req.cookies.auth_token;
        if (existingToken) {
            try {
                const decoded = Auth.verifyToken(existingToken);
                const user = await User.findByPk(decoded.id);

                if (user) {
                    return res.status(200).json({
                        message: Messages.USER_ERR_ALREADY_LOGGED_IN,
                        users: [user]
                    });
                }
                res.clearCookie("auth_token");
            } catch (error: any) {
                res.clearCookie("auth_token");
            }
        }

        const { email, phoneNumber, password } = req.body;
        if (password == null ||
            (email == null && phoneNumber == null)
        ) {
            return res.status(400).json({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        }

        if (typeof password !== "string" ||
            ((email && typeof email !== "string") ||
            (phoneNumber && typeof phoneNumber !== "string" && typeof phoneNumber !== "number"))
        ) {
            return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
        }

        if (email && !isValidEmail(email)) return res.status(400).json({ message: Messages.USER_ERR_EMAIL, users: [] });

        const rawPhone = phoneNumber?.toString().trim() || "";
        const pureDigits = rawPhone.replace(/\D/g, "");

        if (phoneNumber && !isValidPhone(pureDigits)) {
            return res.status(400).json({ message: Messages.USER_ERR_PHONE, users: [] });
        }
        if (password.length < Constants.USER_PASS_MIN_LEN || password.length > Constants.USER_PASS_MAX_LEN) {
            return res.status(400).json({ message: Messages.USER_ERR_PASS_LEN, users: [] });
        }

        let user = await User.findOne({
            where: {
                [Op.or]: [
                    ...(email ? [{ email }] : []),
                    ...(phoneNumber ? [{ phoneNumber: pureDigits }] : [])
                ]
            }
        });
        if (!user) {
            return res.status(401).json({ message: Messages.USER_ERR_LOGIN, users: [] });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password || "");
        if (!isPasswordValid) {
            return res.status(401).json({ message: Messages.USER_ERR_LOGIN, users: [] });
        }

        const token = Auth.createUserToken(user);
        const tokenOptions = Auth.createUserTokenOptions();
        res.cookie("auth_token", token, tokenOptions);

        res.send({
            message: Messages.USER_MSG_LOGIN,
            users: [user]
        });
    } catch (error: any) {
        next(error);
    }
});

/** 
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Logs a user out by clearing the auth cookie
 */
router.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.clearCookie("auth_token");
        res.send({ message: Messages.USER_MSG_LOGOUT });
    } catch (error: any) {
        next(error);
    }
});

/**  
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Sends data about all users in the database
 */
router.get("/all", 
    Auth.authorizeAs("users"), 
    Auth.validatePrivileges("users", 3), 
    async (req: Request, res: Response, next: NextFunction) => 
{
    try {
        const users: UserInstance[] = await User.findAll();

        // Impossible endpoint
        if (users.length === 0) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND_ALL, users: [] });
        }
        res.send({ users });
    } catch (error: any) {
        next(error);
    }
});

/**  
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Sends data about a user with the specified ID
 */
router.get("/id/:userId", 
    Auth.authorizeAs("users"), 
    Auth.validatePrivileges("users", 3), 
    async (req: Request, res: Response, next: NextFunction) => 
{
    try {
        const userId = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, users: [] });
        }

        const user: UserInstance | null = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        }
        res.send({ users: [user] });
    } catch (error: any) {
        next(error);
    }
});

/**  
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Updates data for a user with the specified ID
 * Does not allow for changing of the account type
 */
router.put("/update/:userId", 
    Auth.authorizeAs("users"), 
    Auth.validatePrivileges("users", 0), 
    Auth.validateOwnership("users", 3),
    async (req: Request, res: Response, next: NextFunction) => 
{
    try {
        const userId: number = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, users: [] });
        }

        const user: UserInstance | null = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        }

        if (user.accountType === Constants.USER_ACC_TYPES[3]) {
            return res.status(400).json({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        }

        const { name, password, email, phoneNumber }: UserAttributes = req.body;
        if (name == null && password == null && email == null && phoneNumber == null) {
            return res.status(400).json({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        }

        const updateData: Partial<UserAttributes> = {};
        updateData.accountType = user.accountType;

        const isAuthenticated = user.accountType === Constants.USER_ACC_TYPES[0] ? false : true;
        if (!isAuthenticated && email == null && password == null) {
            return res.status(400).json({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        }

        if (name !== undefined) {
            if (typeof name !== "string") return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
            const trimmed = name.trim();
            if (trimmed.length < Constants.USER_NAME_MIN_LEN || trimmed.length > Constants.USER_NAME_MAX_LEN) {
                return res.status(400).json({ message: Messages.USER_ERR_NAME_LEN, users: [] });
            }
            updateData.name = trimmed;
        }

        if (password !== undefined) {
            if (password !== null && typeof password !== "string") return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
            if (password !== null) {
                const trimmedPass = password.trim();
                if (trimmedPass.length < Constants.USER_PASS_MIN_LEN || trimmedPass.length > Constants.USER_PASS_MAX_LEN) {
                    return res.status(400).json({ message: Messages.USER_ERR_PASS_LEN, users: [] });
                }
                const hashedPassword = await bcrypt.hash(trimmedPass, Constants.USER_PASS_SALT_ROUNDS);
                updateData.password = hashedPassword;
            }
        }

        if (email !== undefined) {
            if (email !== null && typeof email !== "string") return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
            if (email) {
                if (!isValidEmail(email)) return res.status(400).json({ message: Messages.USER_ERR_EMAIL, users: [] });
                const existing = await User.findOne({ where: { email } });
                if (existing && existing.id !== userId) return res.status(400).json({ message: Messages.USER_ERR_EMAIL_UNIQUE, users: [] });
            }
            updateData.email = email;
        }

        if (phoneNumber !== undefined) {
            if (phoneNumber !== null && typeof phoneNumber !== "string" && typeof phoneNumber !== "number") {
                return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
            }

            const rawPhone = phoneNumber?.toString().trim() || "";
            const pureDigits = rawPhone.replace(/\D/g, "");

            if (rawPhone !== "" && (!pureDigits || !isValidPhone(pureDigits))) {
                return res.status(400).json({ message: Messages.USER_ERR_PHONE, users: [] });
            }
            if (pureDigits) {
                const existing = await User.findOne({ where: { phoneNumber: pureDigits } });
                if (existing && existing.id !== userId) {
                    return res.status(400).json({ message: Messages.USER_ERR_PHONE_UNIQUE, users: [] });
                }
            }

            updateData.phoneNumber = pureDigits || null;
        }

        await user.update(updateData);
        res.send({ users: [user] });
    } catch (error: any) {
        next(error);
    }
});

/**  
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Changes account type for a user with the specified ID
 */
router.put("/update-type/:userId",
    Auth.authorizeAs("users"), 
    Auth.validatePrivileges("users", 0), 
    Auth.validateOwnership("users", 3),
    async (req: Request, res: Response, next: NextFunction) => 
{
    try {
        const userId = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, users: [] });
        }

        const user: UserInstance | null = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        }

        if (user.accountType === Constants.USER_ACC_TYPES[3]) {
            return res.status(400).json({ message: Messages.USER_ERR_OWNER_MODIFY, users: [] });
        }

        const { accountType }: UserAttributes = req.body;
        if (accountType !== Constants.USER_ACC_TYPES[0] && // Elevating unauthenticated user to an authenticated one
            accountType !== Constants.USER_ACC_TYPES[1] && // Elevating user to cinema admin
            accountType !== Constants.USER_ACC_TYPES[2] // Revoking Cinema admin priviledges
        ) {
            return res.status(400).json({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        }

        await user.update({ accountType });
        res.send({ users: [user] });
    } catch (error: any) {
        next(error);
    }
});

/**  
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Assigns cinemas to the users
 */
router.put("/assign-cinema", 
    Auth.authorizeAs("users"), 
    Auth.validatePrivileges("users", 3), 
    async (req: Request, res: Response, next: NextFunction) => 
{
    try {
        const { userId, cinemaId } = req.body;

        if (userId == null || cinemaId == null) {
            return res.status(400).json({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        }

        if (typeof userId !== "number" || typeof cinemaId !== "number") {
            return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
        }

        if (userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, users: [] });
        }
        if (cinemaId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.CINEMA_ERR_ID, users: [] });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        }

        const cinema = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, users: [] });
        }

        if (user.accountType !== Constants.USER_ACC_TYPES[2]) {
            return res.status(400).json({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        }

        await (user as any).addCinema(cinema);
        const updatedUser = await User.findByPk(userId, {
            include: [{ model: Cinema, as: 'cinemas' }]
        });

        res.send({
            message: Messages.USER_MSG_CINEMA_ASSIGN,
            users: [updatedUser]
        });
    } catch (error: any) {
        next(error);
    }
});

/**  
 * Only site admin can get to 200 with this endpoint
 * ===============================
 * Deletes a user with the specified ID
 */
router.delete("/delete/:userId",
    Auth.authorizeAs("users"), 
    Auth.validatePrivileges("users", 3), 
    async (req: Request, res: Response, next: NextFunction) => 
{
    try {
        const userId: number = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND });
        }

        console.log(user)

        if (user.accountType === Constants.USER_ACC_TYPES[3]) {
            return res.status(400).json({ message: Messages.USER_ERR_DEL_SITE })
        }
        else {
            await user.destroy();
            res.send({ message: Messages.USER_MSG_DEL });
        }

    } catch (error: any) {
        next(error);
    }
});

export default router;