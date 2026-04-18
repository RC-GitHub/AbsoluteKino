import { User, UserAttributes, UserInstance } from "./models";

import { CONFIG } from './config';
import * as Constants from './constants';
import * as Messages from './messages';

import { registerUserLogic } from "./routes/user";

export const registerOwner = async (data: any | null = {}) => {
    try {
        const userAttributes = {
            name: data.name || CONFIG.INITIAL_OWNER.NAME,
            password: data.password || CONFIG.INITIAL_OWNER.PASSWORD,
            email: data.email || CONFIG.INITIAL_OWNER.EMAIL,
            phoneNumber: data.phoneNumber || CONFIG.INITIAL_OWNER.PHONE_NUMBER,
        }        

        const user: UserInstance = await registerUserLogic(userAttributes);
        user.accountType = Constants.USER_ACC_TYPES[3];

        await user.save();
        console.log(Messages.USER_OWNER);

        return { owner: user, message: Messages.USER_OWNER }
    }
    catch (error: any) {
        console.error(Messages.APP_ERR_OWNER, error.message || error);
        return { owner: null, message: Messages.USER_ERR_OWNER }
    }
}

export const elevateToOwner = async (id: number) => {
    try {
        const user: UserInstance | null = await User.findByPk(id);
        if (!user) {
            return { owner: null, message: Messages.USER_ERR_OWNER_ELEVATE }
        }

        if (user.accountType !== Constants.USER_ACC_TYPES[1] &&
            user.accountType !== Constants.USER_ACC_TYPES[2]
        ) {
            return { owner: null, message: Messages.USER_ERR_OWNER_ELEVATE }
        }

        user.accountType = Constants.USER_ACC_TYPES[3];
        await user.save();

        console.log(Messages.USER_OWNER_ELEVATE);
        return { owner: user, message: Messages.USER_OWNER_ELEVATE }
    }
    catch (error: any) {
        console.error(Messages.APP_ERR_OWNER_ELEVATE, error.message || error);
        return { owner: null, message: Messages.USER_ERR_OWNER_ELEVATE }
    }
}

/**
 * Revokes Site Admin status.
 * Specifically checks if the user is a Site Admin (Index 3) before demoting.
 */
export const revokeSiteAdmin = async (id: number) => {
    try {
        const user: UserInstance | null = await User.findByPk(id);
        
        if (!user) {
            return { user: null, message: Messages.USER_ERR_NOT_FOUND };
        }

        if (user.accountType !== Constants.USER_ACC_TYPES[3]) {
            return { user: null, message: Messages.USER_ERR_NOT_SITE_ADMIN }; 
        }

        // Demote them to a standard Authenticated Customer (Index 1)
        user.accountType = Constants.USER_ACC_TYPES[1];
        await user.save();

        console.log(`[ADMIN] Privileges revoked for UID: ${id}`);
        return { user, message: Messages.USER_MSG_REVOKE };
    } catch (error: any) {
        console.error(Messages.APP_ERR_REVOKE, error.message || error);
        return { user: null, message: Messages.APP_ERR_INTERNAL };
    }
};

/**
 * Updates a Site Admin's profile data.
 * This ensures administrative updates are handled separately from standard user updates.
 */
export const updateSiteAdminData = async (id: number, updateData: Partial<UserAttributes>) => {
    try {
        const user: UserInstance | null = await User.findByPk(id);

        if (!user || user.accountType !== Constants.USER_ACC_TYPES[3]) {
            return { user: null, message: Messages.USER_ERR_NOT_SITE_ADMIN };
        }
        const { accountType, ...safeData } = updateData;

        await user.update(safeData);
        return { user, message: Messages.USER_MSG_UPDATE_SUCCESS };
    } catch (error: any) {
        console.error(Messages.APP_ERR_UPDATE, error.message || error);
        return { user: null, message: Messages.APP_ERR_INTERNAL };
    }
};