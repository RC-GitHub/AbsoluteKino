import sequelize from "../src/models";
import * as Constants from "../src/constants";
import * as Messages from "../src/messages";
import * as Utils from "./utils";

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

describe("Product Lifecycle Flow", async () => {
    let response;

    //---------------------------------
    // Step 1 - POST
    //---------------------------------
    // A Cinema object is created first to satisfy the foreign key constraint.
    // Then products are created with various validation checks.
    // At the end, 1 product exists in the database.
    //---------------------------------

    describe("POST /product/new", async () => {
        it("(MODEL EXAMPLE) should respond with 200 and the created product object", async () => {
            await Utils.sendRequest("/cinema/new", 200, "POST", Utils.cinemaData);

            response = await Utils.sendRequest("/product/new", 200, "POST", Utils.productData);
            expect(response.body).toHaveProperty("products");
            expect(response.body.products[0]).toHaveProperty("id", 1);
            expect(response.body.products[0]).toHaveProperty("name", Utils.productData.name);
            expect(response.body.products[0]).toHaveProperty("size", Utils.productData.size);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // name: null or undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: undefined });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: null });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // price: null or undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: undefined });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: null });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // cinemaId: null or undefined
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: undefined });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: null });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
        });

        it("should respond with 400 if typings are incorrect", async () => {
            // name: not a string
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: 123 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // price: not a number
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: "5.00" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // size: not a string
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, size: true });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // discount: not a number
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, discount: "5" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // cinemaId: not a number
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: "5" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
        });

        it("should respond with 400 if name length is invalid", async () => {
            //Too short
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: "" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: "   " });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });

            //Too long
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, name: "a".repeat(Constants.PRODUCT_NAME_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });
        });

        it("should respond with 400 if price is invalid", async () => {
            // Negative price
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, price: -1 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_PRICE, products: [] });
        });

        it("should respond with 400 if discount is invalid", async () => {
            // Negative discount
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, discount: Constants.PRODUCT_DISCOUNT_MIN_VAL - 1 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_DISCOUNT, products: [] });
           
            // Discount is bigger than max
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, discount: Constants.PRODUCT_DISCOUNT_MAX_VAL + 1 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_DISCOUNT, products: [] });
        });

        it("should respond with 400 if size is not in allowed list", async () => {
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, size: "SuperSize" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_SIZE, products: [] });
        });

        it("should respond with 400 if cinema id is invalid", async () => {
            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: 0 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            response = await Utils.sendRequest("/product/new", 400, "POST", { ...Utils.productData, cinemaId: -1 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
        });

        it("should respond with 404 if cinemaId does not exist", async () => {
            response = await Utils.sendRequest("/product/new", 404, "POST", { ...Utils.productData, cinemaId: 999 });
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
            await Utils.sendRequest("/product/new", 200, "POST", { ...Utils.productData, name: "Popcorn Large", size: "Large" });

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
            response = await Utils.sendRequest("/product/all/cinema/abc", 400, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            response = await Utils.sendRequest("/product/all/cinema/0", 400, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            response = await Utils.sendRequest("/product/all/cinema/-1", 400, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
        });

        it("should respond with 404 if specified cinema object is not found in the database", async () => {
            response = await Utils.sendRequest("/product/all/cinema/3", 404, "GET");
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });
        });

        it("should respond with 404 if cinema has no products", async () => {
            // Create a new cinema (ID 2)
            await Utils.sendRequest("/cinema/new", 200, "POST", { ...Utils.cinemaData, name: "Empty Cinema" });
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
            response = await Utils.sendRequest("/product/update/1", 200, "PUT", updateData);
            expect(Number(response.body.products[0].price)).toBe(updateData.price);
            expect(Number(response.body.products[0].discount)).toBe(updateData.discount);
        });

        it("should respond with 400 if required fields are missing", async () => {
            // all are null
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { name: null, price: null, size: null, discount: null, cinemaId: null });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });

            // all are undefined
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", {});
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] }); 

            // mixed invalid
            const mixedInvalid = { 
                name: null, 
                price: undefined, 
                size: null,
                discount: undefined,
                cinemaId: null
            };
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", mixedInvalid);
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
        });

        it("should respond with 400 if required types are incorrect", async () => {
            // row as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, name: 5 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // price as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, price: true });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // size as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, size: 3 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // discount as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, discount: "a" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });

            // cinemaId as string
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, cinemaId: "123" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
        });
        
        it("should respond with 400 if updated name length is invalid", async () => {
            //Too short
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, name: "" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, name: "   " });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });

            //Too long
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, name: "a".repeat(Constants.PRODUCT_NAME_MAX_LEN + 1) });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });
        });

        it("should respond with 400 if updated price is invalid", async () => {
            // Negative price
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, price: -1 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_PRICE, products: [] });
        });

        it("should respond with 400 if updated discount is invalid", async () => {
            // Negative discount
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, discount: Constants.PRODUCT_DISCOUNT_MIN_VAL - 1 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_DISCOUNT, products: [] });
           
            // Discount is bigger than max
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, discount: Constants.PRODUCT_DISCOUNT_MAX_VAL + 1 });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_DISCOUNT, products: [] });
        });

        it("should respond with 400 if updated size is not in allowed list", async () => {
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, size: "SuperSize" });
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_SIZE, products: [] });
        });

        it("should respond with 400 if updated cinema id is invalid", async () => {
            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, cinemaId: 0 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });

            response = await Utils.sendRequest("/product/update/1", 400, "PUT", { ...Utils.productData, cinemaId: -1 });
            expect(response.body).toEqual({ message: Messages.CINEMA_ERR_ID, products: [] });
        });

        it("should respond with 404 if updated cinemaId does not exist", async () => {
            response = await Utils.sendRequest("/product/update/1", 404, "PUT", { ...Utils.productData, cinemaId: 999 });
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
            await Utils.sendRequest("/product/delete/1", 200, "DELETE");
            response = await Utils.sendRequest("/product/delete/2", 200, "DELETE");
            expect(response.body).toEqual({ message: Messages.PRODUCT_MSG_DEL });

            // Clear cinemas
            await Utils.sendRequest("/cinema/delete/1", 200, "DELETE");
            await Utils.sendRequest("/cinema/delete/2", 200, "DELETE");
        });

        it("should respond with 400 if productId is not valid", async () => {
            response = await Utils.sendRequest("/product/delete/abc", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_ID });

            response = await Utils.sendRequest("/product/delete/0", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_ID });

            response = await Utils.sendRequest("/product/delete/-1", 400, "DELETE");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_ID });
        });

        it("should respond with 404 if deleting non-existent ID", async () => {
            response = await Utils.sendRequest("/product/delete/1", 404, "DELETE");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NOT_FOUND, products: [] });
        });
    });

    //---------------------------------
    // Step 5 - GET (404)
    //---------------------------------
    // Database is empty, fetching all should 404
    //---------------------------------

    describe("GET (404) /product/all", async () => {
        it("should respond with 404 if database is empty", async () => {
            response = await Utils.sendRequest("/product/all", 404, "GET");
            expect(response.body).toEqual({ message: Messages.PRODUCT_ERR_NOT_FOUND_ALL, products: [] });
        });
    });
});