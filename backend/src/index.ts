import { config } from "dotenv";
import "reflect-metadata";
import { createApp } from "./app";
import { registerDependencies } from "./dependencies/register";
import { getContainer } from "./dependencies/container";
import { dependencyTokens } from "./dependencies/tokens";
import { EnvironmentVariableKey } from "./types";

registerDependencies();

const configService = getContainer().resolve(dependencyTokens.configService);

config({
    path: `.env.${configService.getEnvironmentVariable(EnvironmentVariableKey.nodeEnv) ?? "development"}`,
    quiet: true,
});

const app = createApp();

const port = parseInt(
    configService.getEnvironmentVariable(EnvironmentVariableKey.port) ?? "3001",
);

app.listen(port, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Server is running on port ${port.toString()}`);
});
