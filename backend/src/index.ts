import "reflect-metadata";
import { createApp } from "./app";
import { getContainer } from "./dependencies/container";
import { registerDependencies } from "./dependencies/register";
import { dependencyTokens } from "./dependencies/tokens";
import { EnvironmentVariableKey } from "./types";
import { loadEnvironmentVariables } from "./env";

loadEnvironmentVariables();
registerDependencies();

const app = createApp();
const configService = getContainer().resolve(dependencyTokens.configService);

const port = parseInt(
    configService.getEnvironmentVariable(EnvironmentVariableKey.Port) ?? "3001",
);

app.listen(port, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Server is running on port ${port.toString()}`);
});
