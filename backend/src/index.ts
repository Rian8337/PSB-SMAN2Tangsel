import "reflect-metadata";
import { createApp, loadEnvironmentVariables } from "./app";
import { getContainer } from "./dependencies/container";
import { registerDependencies } from "./dependencies/register";
import { dependencyTokens } from "./dependencies/tokens";
import { EnvironmentVariableKey } from "./types";

registerDependencies();
loadEnvironmentVariables();

const app = createApp();
const configService = getContainer().resolve(dependencyTokens.configService);

const port = parseInt(
    configService.getEnvironmentVariable(EnvironmentVariableKey.port) ?? "3001",
);

app.listen(port, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Server is running on port ${port.toString()}`);
});
