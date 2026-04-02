import idMessages from "../messages/id.json";
import enMessages from "../messages/en.json";
import { routing } from "./i18n/routing";

declare global {
    interface Window {
        /**
         * Runtime API base URL injected by the server-rendered layout.
         */
        __API_BASE_URL__?: string;
    }

    namespace NodeJS {
        interface ProcessEnv {
            readonly API_BASE_URL?: string;
            readonly NEXT_PUBLIC_API_URL?: string;
        }
    }
}

declare module "next-intl" {
    interface AppConfig {
        Messages: typeof idMessages | typeof enMessages;
        Locale: (typeof routing.locales)[number];
    }
}
