import idMessages from "../messages/id.json";
import enMessages from "../messages/en.json";
import { routing } from "./i18n/routing";

declare module "next-intl" {
    interface AppConfig {
        Messages: typeof idMessages | typeof enMessages;
        Locale: (typeof routing.locales)[number];
    }
}
