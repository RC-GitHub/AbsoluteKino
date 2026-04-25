import sequelize, { User, Cinema, Product, UserInstance } from "../src/models";
import * as Constants from "../src/constants";
import * as Messages from "../src/messages";
import * as Utils from "./utils";

let cinemaAdmin: UserInstance;

let siteAdminCookie: string[] | undefined = [];
let regularCookie: string[] | undefined = [];
let cinemaAdminCookie: string [] | undefined = [];
let unauthorizedCinemaAdminCookie: string [] | undefined = [];

let cinemaId: number;

//---------------------------------
// Step 0 - Users
//---------------------------------
// Site admin and regular user are created before all tests
// Their cookies are stored for use in subsequent tests
//---------------------------------

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const siteAdminData = await Utils.createSiteAdmin();
    const regularUserData = await Utils.createRegularUser();

    siteAdminCookie = siteAdminData.cookie;
    regularCookie = regularUserData.cookie;
});

afterAll(async () => {
    await User.destroy({ where: {}, cascade: true })
    await Cinema.destroy({ where: {}, cascade: true })
});

describe("Product Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // A Cinema object is created first to satisfy the foreign key constraint
    // Then a cinema admin is created and connected with that cinema
    // His cookie is stored for use in subsequent tests
    // Then products are created with various validation checks
    // At the end, 1 product exists in the database.
    //---------------------------------

    describe("POST /product/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created product object", async () => {
            response = await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData, siteAdminCookie);
            cinemaId = response.body.cinemas[0].id;

            let cinemaAdminData = await Utils.createRegularUser();
            cinemaAdmin = cinemaAdminData.user;
            cinemaAdminCookie = cinemaAdminData.cookie;
            response = await Utils.sendRequest("/user/assign-cinema", 200, "PUT", { userId: cinemaAdmin.id, cinemaId: cinemaId }, siteAdminCookie);

            response = await Utils.sendRequest("/product/new", 200, "POST", Utils.productData, cinemaAdminCookie);
            expect(response.body).toHaveProperty("products");
            expect(response.body.products[0]).toHaveProperty("id", 1);
            expect(response.body.products[0]).toHaveProperty("name", Utils.productData.name);
            expect(response.body.products[0]).toHaveProperty("size", Utils.productData.size);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // name: null or undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // price: null or undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // cinemaId: null or undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: undefined }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            // all are undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            // all are null
            response = await Utils.sendRequest("/product/new", 400, "POST", { name: null, price: null, size: null, discount: null, cinemaId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            // mixed invalid
            const mixedInvalid = {
                name: null,
                price: undefined,
                size: null,
                discount: undefined,
                cinemaId: null
            };
            response = await Utils.sendRequest("/product/new", 400, "POST", mixedInvalid, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
        });

        it("should respond with 400 if typings are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: 123 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // price: not a number
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: "5.00" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // size: not a string
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, size: true }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // discount: not a number
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, discount: "5" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // cinemaId: not a number
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: "5" }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
        });

        it("should respond with 400 if name length is invalid", async () => {
            await Utils.boundsCheck(
                "/product/new",
                "POST",
                Utils.productData,
                Constants.PRODUCT_NAME_MIN_LEN,
                Constants.PRODUCT_NAME_MAX_LEN,
                Messages.PRODUCT_ERR_NAME_LEN,
                "name",
                "string",
                "products",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if price is invalid", async () => {
            // Negative price
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_PRICE, products: [] });
        });

        it("should respond with 400 if discount is invalid", async () => {
            await Utils.boundsCheck(
                "/product/new",
                "POST",
                Utils.productData,
                Constants.PRODUCT_DISCOUNT_MIN_VAL,
                Constants.PRODUCT_DISCOUNT_MAX_VAL,
                Messages.PRODUCT_ERR_DISCOUNT,
                "discount",
                "number",
                "products",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if size is not in allowed list", async () => {
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, size: "SuperSize" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_SIZE, products: [] });
        });

        it("should respond with 400 if cinema id is invalid", async () => {
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/product/new", "POST", {}, "products");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/product/new", "POST", {}, "products");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /new", async () => {
            await Utils.deletedAdminCheck("/product/new", "POST", {}, "products");
        });

        it("should respond with 301 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/product/new", "POST", {}, "products", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /new", async () => {
            await Utils.unauthorizedCheck("/product/new", "POST", {}, "products", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /new", async () => {
            let unauthorizedCinemaAdminData = await Utils.createRegularUser();
            unauthorizedCinemaAdminData = await Utils.levelUserTo(unauthorizedCinemaAdminData.user, 2, unauthorizedCinemaAdminData.cookie);
            unauthorizedCinemaAdminCookie = unauthorizedCinemaAdminData.cookie;

            await Utils.unauthorizedCheck("/product/new", "POST", { cinemaId: cinemaId }, "products", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if cinemaId does not exist", async () => {
            response = await Utils.sendRequest("/product/new", 404, "POST", { ...Utils.productData, cinemaId: 99 }, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });
        });
    });

    //---------------------------------
    // Step 2 - GET
    //---------------------------------
    // Fetches all products and products filtered by cinema.
    // At the end, 2 products and 2 cinemas exist in the database.
    //---------------------------------

    describe("GET /product/all", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and all products", async () => {
            // Add second product
            await Utils.sendRequest("/product/new", 200, "POST", { ...Utils.productData, name: "Popcorn Large", size: "Large" }, cinemaAdminCookie);

            response = await Utils.sendRequest("/product/all", 200, "GET");
            expect(response.body.products).toHaveLength(2);
        });
    });

    describe("GET /product/all/cinema/:cinemaId", async () => {
        it("should respond with 200 and products for specific cinema", async () => {
            response = await Utils.sendRequest("/product/all/cinema/1", 200, "GET");
            expect(response.body.products).toBeInstanceOf(Array);
            expect(response.body.products.length).toBe(2);
        });

        it("should respond with 400 if cinemaId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/product/all/cinema",
                "GET",
                {},
                Messages.CINEMA_ERR_ID,
                "products",
            );
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/product/all/cinema/99", 404, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });
        });

        it("should respond with 404 if cinema has no products", async () => {
            // Create a new cinema (ID 2)
            await Utils.sendRequest("/cinema/new", 200, "POST", { ...Utils.cinemaData, name: "Empty Cinema" }, siteAdminCookie);

            response = await Utils.sendRequest("/product/all/cinema/2", 404, "GET");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NOT_FOUND_CINEMA, products: [] });
        });
    });

    //---------------------------------
    // Step 3 - PUT
    //---------------------------------
    // Updates product details and verifies constraints.
    // At the end of the step there's 2 product objects and 2 cinema objects
    //---------------------------------

    describe("PUT /product/update/:productId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and update product fields", async () => {
            const updateData = { price: 15.50, discount: 10 };
            response = await Utils.sendRequest("/product/update/1", 200, "PUT", updateData, cinemaAdminCookie);
            expect(Number(response.body.products[0].price)).toBe(updateData.price);
            expect(Number(response.body.products[0].discount)).toBe(updateData.discount);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // all are null
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { name: null, price: null, size: null, discount: null, cinemaId: null }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // all are undefined
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // mixed invalid
            const mixedInvalid = {
                name: null,
                price: undefined,
                size: null,
                discount: undefined,
                cinemaId: null
            };
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", mixedInvalid, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // row as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, name: 5 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // price as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, price: true }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // size as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, size: 3 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // discount as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, discount: "a" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // cinemaId as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, cinemaId: "123" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
        });

        it("should respond with 400 if updated name length is invalid", async () => {
            await Utils.boundsCheck(
                "/product/update/1",
                "PUT",
                Utils.productData,
                Constants.PRODUCT_NAME_MIN_LEN,
                Constants.PRODUCT_NAME_MAX_LEN,
                Messages.PRODUCT_ERR_NAME_LEN,
                "name",
                "string",
                "products",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated price is invalid", async () => {
            // Negative price
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, price: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_PRICE, products: [] });
        });

        it("should respond with 400 if updated discount is invalid", async () => {
            await Utils.boundsCheck(
                "/product/update/1",
                "PUT",
                Utils.productData,
                Constants.PRODUCT_DISCOUNT_MIN_VAL,
                Constants.PRODUCT_DISCOUNT_MAX_VAL,
                Messages.PRODUCT_ERR_DISCOUNT,
                "discount",
                "number",
                "products",
                cinemaAdminCookie
            );
        });

        it("should respond with 400 if updated size is not in allowed list", async () => {
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, size: "SuperSize" }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_SIZE, products: [] });
        });

        it("should respond with 400 if updated cinema id is invalid", async () => {
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, cinemaId: 0 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, cinemaId: -1 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/product/update/1", "PUT", {}, "products");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/product/update/1", "PUT", {}, "products");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /update", async () => {
            await Utils.deletedAdminCheck("/product/update/1", "PUT", {}, "products");
        });

        it("should respond with 301 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/product/update/1", "PUT", {}, "products", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /update", async () => {
            await Utils.unauthorizedCheck("/product/update/1", "PUT", {}, "products", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /update", async () => {
            await Utils.unauthorizedCheck("/product/update/1", "PUT", { cinemaId: cinemaId }, "products", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if specified product object is not found in the database", async () => {
            response = await Utils.sendRequest("/product/update/99", 404, "PUT", Utils.productData, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NOT_FOUND, products: [] });
        });

        it("should respond with 404 if updated cinemaId does not exist", async () => {
            response = await Utils.sendRequest("/product/update/1", 404, "PUT", { ...Utils.productData, cinemaId: 99 }, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });
        });
    });

    //---------------------------------
    // Step 4 - DELETE
    //---------------------------------
    // All product and cinema objects are being deleted one by one
    // Then tests go over all cases which result in deletion failure
    // At the end of the step no product objects are in the database
    //---------------------------------

    describe("DELETE /product/delete/:productId", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and delete product", async () => {
            response = await Utils.sendRequest("/product/delete/1", 200, "DELETE", {}, cinemaAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_MSG_DEL });
        });

        it("should respond with 400 if productId is not valid", async () => {
            await Utils.invalidIdCheck(
                "/product/delete",
                "DELETE",
                {},
                Messages.PRODUCT_ERR_ID,
                "products",
                siteAdminCookie
            );
        });

        it("should respond with 401 when no cookies are provided", async () => {
            await Utils.noCookieCheck("/product/delete/1", "DELETE", {}, "products");
        });

        it("should respond with 401 when trying to use the same cookie after logout", async () => {
            await Utils.freshTokenCheck("/product/delete/1", "DELETE", {}, "products");
        });

        it("should respond with 401 when a deleted site admin user with valid cookies tries to access /delete", async () => {
            await Utils.deletedAdminCheck("/product/delete/1", "DELETE", {}, "products");
        });

        it("should respond with 301 when accessing a protected route with a tampered cookie", async () => {
            await Utils.tamperedCookieCheck("/product/delete/1", "DELETE", {}, "products", siteAdminCookie)
        });

        it("should respond with 403 when a regular user tries to access /delete", async () => {
            await Utils.unauthorizedCheck("/product/delete/1", "DELETE", {}, "products", regularCookie)
        });

        it("should respond with 403 when a cinema admin without necessary privileges tries to access /delete", async () => {
            await Utils.unauthorizedCheck("/product/delete/2", "DELETE", { cinemaId: cinemaId }, "products", unauthorizedCinemaAdminCookie)
        });

        it("should respond with 404 if deleting non-existent ID", async () => {
            response = await Utils.sendRequest("/product/delete/99", 404, "DELETE", {}, siteAdminCookie);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NOT_FOUND });
        });
    });

    //---------------------------------
    // Step 5 - GET (404)
    //---------------------------------
    // Database is empty, fetching all should 404
    //---------------------------------

    describe("GET (404) /product/all", async () => {
        it("should respond with 404 if database is empty", async () => {
            await Product.destroy({ where: {}, cascade: true })

            response = await Utils.sendRequest("/product/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NOT_FOUND_ALL, products: [] });
        });
    });
});
