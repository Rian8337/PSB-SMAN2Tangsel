import { Provider } from "@/components/ui/provider";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/providers";
import { hasLocale, Locale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

export async function generateMetadata({
    params,
}: {
    params: { locale: Locale };
}) {
    const t = await getTranslations({
        locale: params.locale,
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
    params: Promise<{ locale: Locale }>;
}

export default async function LocaleLayout(props: PropsWithChildren<Props>) {
    const { children, params } = props;
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body>
                <NextIntlClientProvider messages={messages}>
                    <Provider>
                        <AppProviders>{children}</AppProviders>
                    </Provider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
