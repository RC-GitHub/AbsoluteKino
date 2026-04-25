import { Router, Request, Response, NextFunction } from "express";
import {
    Cinema, CinemaAttributes, CinemaInstance,
    Product, ProductAttributes, ProductInstance
} from "../models.js";

import * as Constants from "../constants.ts";
import * as Messages from "../messages.ts";
import * as Auth from "../middleware/auth.ts";

const router = Router();

/**
 * Only cinema admin and higher can get to 200 with this endpoint
 * ===============================
 * Adds product to the database
 * Requires name, price and cinema id
 * Additionally allows the request to have size and discount
 */
router.post(
    "/new",
    Auth.authorize("products"),
    Auth.validatePrivileges("products", 2),
    Auth.validateCinemaMembership("products", 3),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, price, size, discount, cinemaId } : ProductAttributes = req.body;

        if (name == null || price == null || cinemaId == null) {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
        }

        if (typeof name !== "string" || typeof price !== "number" ||
            (size !== undefined && typeof size !== "string") || (discount !== undefined && typeof discount !== "number") ||
            typeof cinemaId !== "number") {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
        }

        const trimmedName = name.trim();
        if (trimmedName.length < Constants.PRODUCT_NAME_MIN_LEN || trimmedName.length > Constants.PRODUCT_NAME_MAX_LEN) {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });
        }

        if (price < Constants.PRODUCT_PRICE_MIN_VAL) {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_PRICE, products: [] });
        }

        if (size != null) {
            if (!Constants.PRODUCT_SIZES.includes(size)) {
                return res.status(400).json({ message: Messages.PRODUCT_ERR_SIZE, products: [] });
            }
        }

        if (discount != null) {
            if (discount < Constants.PRODUCT_DISCOUNT_MIN_VAL || discount > Constants.PRODUCT_DISCOUNT_MAX_VAL) {
                return res.status(400).json({ message: Messages.PRODUCT_ERR_DISCOUNT, products: [] });
            }
        }

        if (cinemaId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.CINEMA_ERR_ID, products: [] });
        }

        const cinema = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });
        }

        const newProduct = await Product.create({
            name: trimmedName,
            price,
            size,
            discount,
            cinemaId
        });
        res.send({ products: [newProduct] });
    } catch (error) {
        next(error);
    }
});

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Sends data about all products
 */
router.get("/all", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products: ProductInstance[] = await Product.findAll();
        if (products.length === 0) {
            return res.status(404).json({ message: Messages.PRODUCT_ERR_NOT_FOUND_ALL, products: [] });
        }
        res.send({ products });
    } catch (error) {
        next(error);
    }
});

/**
 * Anyone can get to 200 with this endpoint
 * ===============================
 * Fetches products for a specific cinema
 */
router.get("/all/cinema/:cinemaId", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cinemaId: number = parseInt(req.params.cinemaId.toString());
        if (isNaN(cinemaId) || cinemaId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.CINEMA_ERR_ID, products: [] });
        }

        const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId);
        if (!cinema) {
            return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });
        }

        const products: ProductInstance[] = await Product.findAll({ where: { cinemaId } });
        if (products.length === 0) {
            return res.status(404).json({ message: Messages.PRODUCT_ERR_NOT_FOUND_CINEMA, products: [] });
        }
        res.send({ products });
    } catch (error) {
        next(error);
    }
});

/**
 * Only cinema admin or higher can get to 200 with this endpoint
 * ===============================
 * Updates data for a product with the specified ID
 */
router.put(
    "/update/:productId",
    Auth.authorize("products"),
    Auth.validatePrivileges("products", 2),
    Auth.validateProductAccess("products", 3),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const productId: number = parseInt(req.params.productId.toString());
        const { name, price, size, discount, cinemaId } = req.body;

        if (isNaN(productId) || productId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_ID, products: [] });
        }

        const product: ProductInstance | null = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: Messages.PRODUCT_ERR_NOT_FOUND, products: [] });
        }

        if ((name === undefined || name === null) &&
            (price === undefined || price === null) &&
            (size === undefined || size === null) &&
            (discount === undefined || discount === null) &&
            (cinemaId === undefined || cinemaId === null)) {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_EMPTY_ARGS, products: [] });
        }

        if (name !== undefined) {
            if (typeof name !== "string") return res.status(400).json({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
            const trimmedName = name.trim();
            if (trimmedName.length < Constants.PRODUCT_NAME_MIN_LEN || trimmedName.length > Constants.PRODUCT_NAME_MAX_LEN) {
                return res.status(400).json({ message: Messages.PRODUCT_ERR_NAME_LEN, products: [] });
            }
            product.name = trimmedName;
        }

        if (price !== undefined) {
            if (typeof price !== "number") return res.status(400).json({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
            if (price < Constants.PRODUCT_PRICE_MIN_VAL) return res.status(400).json({ message: Messages.PRODUCT_ERR_PRICE, products: [] });
            product.price = price;
        }

        if (size !== undefined) {
            if (typeof size !== "string") return res.status(400).json({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
            if (!Constants.PRODUCT_SIZES.includes(size)) {
                return res.status(400).json({ message: Messages.PRODUCT_ERR_SIZE, products: [] });
            }
            product.size = size;
        }

        if (discount !== undefined) {
            if (typeof discount !== "number") return res.status(400).json({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
            if (discount < Constants.PRODUCT_DISCOUNT_MIN_VAL || discount > Constants.PRODUCT_DISCOUNT_MAX_VAL) {
                return res.status(400).json({ message: Messages.PRODUCT_ERR_DISCOUNT, products: [] });
            }
            product.discount = discount;
        }

        if (cinemaId !== undefined) {
            if (typeof cinemaId !== "number") return res.status(400).json({ message: Messages.PRODUCT_ERR_TYPING, products: [] });
            if (cinemaId < Constants.TYPICAL_MIN_ID) return res.status(400).json({ message: Messages.CINEMA_ERR_ID, products: [] });

            const cinema: CinemaInstance | null = await Cinema.findByPk(cinemaId);
            if (!cinema) return res.status(404).json({ message: Messages.CINEMA_ERR_NOT_FOUND, products: [] });

            product.cinemaId = cinemaId;
        }

        await product.save();
        res.send({ products: [product] });
    } catch (error) {
        next(error);
    }
});


/**
 * Only cinema admin or higher can get to 200 with this endpoint
 * ===============================
 * Deletes a product with the specified ID
 */
router.delete("/delete/:productId",
    Auth.authorize("products"),
    Auth.validatePrivileges("products", 2),
    Auth.validateProductAccess("products", 3),
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const productId: number = parseInt(req.params.productId.toString());
        if (isNaN(productId) || productId < Constants.TYPICAL_MIN_ID) {
            return res.status(400).json({ message: Messages.PRODUCT_ERR_ID });
        }

        const deletedRows = await Product.destroy({ where: { id: productId } });
        if (deletedRows === 0) {
            return res.status(404).json({ message: Messages.PRODUCT_ERR_NOT_FOUND, products: [] });
        }
        res.send({ message: Messages.PRODUCT_MSG_DEL });
    } catch (error) {
        next(error);
    }
});

export default router;
