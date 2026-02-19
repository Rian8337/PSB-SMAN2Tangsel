import { Router } from "express";
// Ensure controllers are loaded and metadata is registered
import "./controllers";

export function createRouter() {
    const router = Router();

    return router;
}
