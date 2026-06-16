import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoute from './routes/upload.js';
import categorizeRoute from './routes/categorize.js';
import healthRoute from './routes/health.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use('/api/upload', uploadRoute);
app.use('/api/categorize', categorizeRoute);
app.use('/api/health', healthRoute);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
