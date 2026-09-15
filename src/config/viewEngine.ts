import { Application } from "express";

export const configViewEngine = (app: Application): void => {
  app.set("view engine", "ejs");
  app.set("views", "./src/shared/views");
};
