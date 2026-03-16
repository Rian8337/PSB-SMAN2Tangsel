// Needed for tsyringe to work properly in tests
import "reflect-metadata";
import { loadEnvironmentVariables } from "@/env";

loadEnvironmentVariables(true);
