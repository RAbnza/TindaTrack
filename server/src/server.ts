import { app } from "./app.js";

const port = 3000;

app.listen(port, () => {
  console.log(
    `TindaTrack API listening on http://localhost:${port}`,
  );
});