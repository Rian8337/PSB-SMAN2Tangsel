import { Provider } from "@/components/ui/provider";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/providers";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

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
