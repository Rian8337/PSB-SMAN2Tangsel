import { Provider } from "@/components/ui/provider";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/providers";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "Global",
    });

    return {
        title: {
            template: `%s | ${t("appName")}`,
            default: t("appName"),
        },
    };
}

interface Props {
    params: Promise<{ locale: string }>;
}

export default async function LocaleLayout(props: PropsWithChildren<Props>) {
    const { children, params } = props;
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = await getMessages();

    const runtimeApiBaseUrl =
        process.env.API_BASE_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://127.0.0.1:3001";

    const runtimeApiScript = `window.__API_BASE_URL__=${JSON.stringify(runtimeApiBaseUrl)};`;

    return (
        <html lang={locale} suppressHydrationWarning>
            <body>
                <script
                    dangerouslySetInnerHTML={{ __html: runtimeApiScript }}
                />
                <NextIntlClientProvider messages={messages}>
                    <Provider>
                        <AppProviders>{children}</AppProviders>
                    </Provider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
