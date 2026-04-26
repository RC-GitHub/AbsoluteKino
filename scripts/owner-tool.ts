import sequelize from '../src/models';
import { registerSiteAdmin, elevateToSiteAdmin, revokeSiteAdmin } from '../src/owner';
import { CONFIG } from '../src/config';

async function run() {
    const args = process.argv.slice(2);
    const action = args[0];

    try {
        await sequelize.authenticate();

        switch (action) {
            case 'add':
                const [name, email, password, phone] = args.slice(1);
                console.log(`[CLI] Registering admin: ${email}...`);
                const resAdd = await registerSiteAdmin({
                    name, email, password, phoneNumber: phone
                });
                console.log(resAdd.message);
                break;

            case 'elevate':
                const idToElevate = parseInt(args[1]);
                const resElevate = await elevateToSiteAdmin(idToElevate);
                console.log(resElevate.message);
                break;

            case 'revoke':
                const idToRevoke = parseInt(args[1]);
                const resRevoke = await revokeSiteAdmin(idToRevoke);
                console.log(resRevoke.message);
                break;

            case 'add-default':
                console.log(`[CLI] Adding default admin from .env...`);
                const resDefault = await registerSiteAdmin({
                    name: CONFIG.INITIAL_OWNER.NAME,
                    email: CONFIG.INITIAL_OWNER.EMAIL,
                    password: CONFIG.INITIAL_OWNER.PASSWORD,
                    phoneNumber: CONFIG.INITIAL_OWNER.PHONE_NUMBER
                });
                console.log(resDefault.message);
                break;

            default:
                console.log(`
Usage: npm run admin -- [action] [parameters]
Available actions:
  add [name] [email] [password] [phone] - Registers a new admin
  elevate [id]                          - Elevates an existing user to admin
  revoke [id]                           - Revokes admin privileges
  add-default                           - Adds admin from .env configuration
                `);
        }
    } catch (error) {
        console.error("[CLI] Error:", error);
    } finally {
        await sequelize.close();
    }
}

run();
