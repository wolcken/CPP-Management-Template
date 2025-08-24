export type Brand = {
    name: string;
    nit?: string;
    logoLight: string;
    logoDark?: string;
    pdf?: {
        headerTitle?: string;
        footerText?: string;
    };
    ui?: {
        currency?: string;
        ivaRate?: number;
    };
};