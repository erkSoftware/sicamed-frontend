import axe from "axe-core";

export const configureAxe = (elemento: HTMLElement): Promise<axe.AxeResults> =>
  axe.run(elemento, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
