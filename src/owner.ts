import { UserAttributes, UserInstance } from "./models";

import { CONFIG } from './config';
import * as Constants from './constants';
import * as Messages from './messages';

import { registerUserLogic } from "./routes/user";

export const registerOwner = async (data: any | null = {}) => {
    try {
        const userAttributes: UserAttributes = {
            name: data.name || CONFIG.INITIAL_OWNER.NAME,
            accountType: Constants.USER_ACC_TYPES[3],
            password: data.password || CONFIG.INITIAL_OWNER.PASSWORD,
            email: data.email || CONFIG.INITIAL_OWNER.EMAIL,
            phoneNumber: data.phoneNumber || CONFIG.INITIAL_OWNER.PHONE_NUMBER,
        }        

        const user: UserInstance = await registerUserLogic(userAttributes);
        await user.save();

        console.log(Messages.USER_OWNER);

        return { owner: user, message: Messages.USER_OWNER }
    }
    catch (error: any) {
        console.error(Messages.APP_ERR_OWNER, error.message || error);
        return { owner: null, message: Messages.USER_ERR_OWNER }
    }
}
