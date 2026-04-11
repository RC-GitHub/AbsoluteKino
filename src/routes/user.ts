import { User, UserAttributes, UserInstance } from "../models.js";
import { Request, Response, NextFunction, Router } from "express";
import * as Messages from "../messages";
import * as Constants from "../constants";
import bcrypt from "bcryptjs";

const router = Router();

const isValidPhone = (phone: string): boolean => {
    const regex = new RegExp(Constants.USER_PHONE_REGEX);
    return regex.test(phone);
};

const isValidEmail = (email: string): boolean => {
    const regex = new RegExp(Constants.USER_EMAIL_REGEX);
    return regex.test(email);
};

/** Adds a new user to the database
 * Requires: name and account type
 * Based on whether the user is authorized or not
 * the request can also include the password, email and the phone number
 */
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { name, accountType, password, email, phoneNumber }: UserAttributes = req.body;

        if (accountType == null) {
            return res.status(400).json({ message: Messages.USER_ERR_EMPTY_ARGS, users: [] });
        }

        if (
            (name !== undefined && name !== null && typeof name !== "string") ||
            typeof accountType !== "string" ||
            (password !== undefined && password !== null && typeof password !== "string") ||
            (email !== undefined && email !== null && typeof email !== "string") ||
            (phoneNumber !== undefined && phoneNumber !== null && typeof phoneNumber !== "string" && typeof phoneNumber !== "number")
        ) {
            return res.status(400).json({ message: Messages.USER_ERR_TYPING, users: [] });
        }

        if (!Constants.USER_ACC_TYPES.includes(accountType as any)) {
            return res.status(400).json({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        }

        const isAuthenticated: boolean = accountType === Constants.USER_ACC_TYPES[0] ? false : true;
        if (!isAuthenticated && email == null && phoneNumber == null) {
            return res.status(400).json({ message: Messages.USER_ERR_UNAUTHORIZED, users: [] });
        }

        if (isAuthenticated) {
            if (name) {
                name = name.trim();
                if (name.length < Constants.USER_NAME_MIN_LEN || name.length > Constants.USER_NAME_MAX_LEN) {
                    return res.status(400).json({ message: Messages.USER_ERR_NAME_LEN, users: [] });
                }
            }
            else {
                return res.status(400).json({ message: Messages.USER_ERR_NAME_LEN, users: [] });
            }
        }
        else {
            name = `Guest_${Date.now()}`;
        }

        let hashedPassword: string | null = null;
        if (isAuthenticated) {
            if (password) {
                const trimmedPass = password.trim();
                if (trimmedPass.length < Constants.USER_PASS_MIN_LEN || trimmedPass.length > Constants.USER_PASS_MAX_LEN) {
                    return res.status(400).json({ message: Messages.USER_ERR_PASS_LEN, users: [] });
                }
                hashedPassword = await bcrypt.hash(trimmedPass, Constants.USER_PASS_SALT_ROUNDS);
            }
            else {
                return res.status(400).json({ message: Messages.USER_ERR_PASS_LEN, users: [] });
            }
        }

        if (email && !isValidEmail(email)) {
            return res.status(400).json({ message: Messages.USER_ERR_EMAIL, users: [] });
        }

        let pureDigits: string | null = null;
        if (phoneNumber !== undefined && phoneNumber !== null) {
            const rawPhone = phoneNumber.toString().trim();
            pureDigits = rawPhone.replace(/\D/g, "");
            if (pureDigits.length === 0 || !isValidPhone(pureDigits)) {
                return res.status(400).json({ message: Messages.USER_ERR_PHONE, users: [] });
            }
        }

        if (email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return res.status(400).json({ message: Messages.USER_ERR_EMAIL_UNIQUE, users: [] });
        }
        if (pureDigits) {
            const existingPhone = await User.findOne({ where: { phoneNumber: pureDigits } });
            if (existingPhone) return res.status(400).json({ message: Messages.USER_ERR_PHONE_UNIQUE, users: [] });
        }

        const newUser = await User.create({
            name,
            accountType,
            password: hashedPassword,
            email,
            phoneNumber: pureDigits,
        });

        res.send({ users: [newUser] });
    } catch (error) {
        next(error);
    }
});

/**
 * Sends data about all users in the database
 */ 
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users: UserInstance[] = await User.findAll();
        if (users.length === 0) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND_ALL, users: [] });
        }
        res.send({ users });
    } catch (error) {
        next(error);
    }
});

// Sends data about a user with the specified ID
router.get("/id/:userId", async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
        next(error);
    }
});

// Updates data for a user with the specified ID
// Does not allow for changing of the account type
router.put("/update/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, users: [] });
        }

        const user: UserInstance | null = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        }

        const { name, password, email, phoneNumber } : UserAttributes = req.body;
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
    } catch (error) {
        next(error);
    }
});

// Changes account type for a user with the specified ID
router.put("/update-type/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID, users: [] });
        }

        const user: UserInstance | null = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND, users: [] });
        }

        const { accountType } : UserAttributes = req.body;
        if (!Constants.USER_ACC_TYPES.includes(accountType as any)) {
            return res.status(400).json({ message: Messages.USER_ERR_ACC_TYPE, users: [] });
        }

        await user.update({ accountType });
        res.send({ users: [user] });
    } catch (error) {
        next(error);
    }
});


// Deletes a user with the specified ID
router.delete("/delete/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = parseInt(req.params.userId.toString());
        if (isNaN(userId) || userId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.USER_ERR_ID });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: Messages.USER_ERR_NOT_FOUND });
        }

        await user.destroy();
        res.send({ message: Messages.USER_MSG_DEL });
    } catch (error) {
        next(error);
    }
});

export default router;