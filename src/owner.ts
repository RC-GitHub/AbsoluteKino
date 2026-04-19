import { User, UserAttributes, UserInstance } from "./models";

import { CONFIG } from './config';
import * as Constants from './constants';
import * as Messages from './messages';

import { registerUserLogic } from "./routes/user";

/**
 * Adds Site Admin user.
 */
export const registerSiteAdmin = async (data: any = {}) => {
    try {
        const name = data.name 
        const password = data.password 
        const email = data.email 
        const phoneNumber = data.phoneNumber 

        const user: UserInstance = await registerUserLogic({ name, password, email, phoneNumber });
        user.accountType = Constants.USER_ACC_TYPES[3];
        await user.save();

        return { owner: user, message: Messages.USER_OWNER };
    } catch (error: any) {
        return { owner: null, message: error.message || Messages.USER_ERR_OWNER };
    }
};

/**
 * Elevates an existing user to Site Admin status.
 */
export const elevateToSiteAdmin = async (id: number) => {
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

/**
 * Deletes a site admin
 * Does not allow for deleting of other users
 */
export const deleteSiteAdmin = async (id: number) => {
    try {
        const user: UserInstance | null = await User.findByPk(id);
        if (!user || user.accountType !== Constants.USER_ACC_TYPES[3]) {
            return { user: null, message: Messages.USER_ERR_NOT_SITE_ADMIN };
        }
        
        await user.destroy();
        return { message: Messages.USER_MSG_DEL_SUCCESS };
    } catch (error: any) {
        console.error(Messages.APP_ERR_UPDATE, error.message || error);
        return { message: Messages.APP_ERR_INTERNAL };
    }
};
