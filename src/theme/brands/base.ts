import type { Brand } from "../brand";

export const BRAND_BASE: Brand = {
  name: "Modelo CPP",
  nit: "",
  logoLight: "/brand/logo.png",
  logoDark: "/brand/logo-invert.png",
  pdf: {
    headerTitle: "Modelo Costo Promedio Ponderado",
    footerText: "Sistema base – Bolivia",
  },
  ui: {
    currency: "BOB",
    ivaRate: 0.13,
  },
};
