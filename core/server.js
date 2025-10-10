import express from 'express';

export default function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.disable("x-powered-by");

  app.get("/", (req, res) => {
    res.send("Chaldea Bot is running!");
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`Chaldea Bot server is running on port ${port}`);
  });

  return app;
}
