import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config();

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Listing on http://localhost:${PORT}`);
    });
    app.on("error", () => {
      console.log("Unable to connect to DB");
      process.exit();
    });
  })
  .catch((err) => {
    console.log("Error: DB connection failed", err);
  });
