import { createServer } from "./server";

const app = createServer();

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
