import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({})); // middleware used for cross origin policies
app.use(express.json({ limit: "100kb" })); // middle ware used to set the to accept json data with the limit of 100kb
app.use(express.urlencoded({ extended: true, limit: "100kb" })); // middle ware use to parse the url, extended is used for nested objects
app.use(express.static("public")); // this is used to save and fetch the static file on the server and keeps in the public folder
app.use(cookieParser()); // this is used to set and fetch cookies onto the client from the server

import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export default app;
