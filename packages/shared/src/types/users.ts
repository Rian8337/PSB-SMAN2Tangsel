import z from "zod";
import { insertUserSchema } from "../validator";

/**
 * The type of data required to insert a new user into the database.
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
