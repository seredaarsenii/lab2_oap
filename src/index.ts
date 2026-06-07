import { createApp } from './app.js';
import { dbPath, initDb } from './db/db.js';

const PORT = 3000;

await initDb();

const app = createApp();
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`SQLlite database: ${dbPath}`);
});
