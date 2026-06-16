import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import os from 'os';
import path from 'path';

const router = express.Router();

const fileSizeLimit = 200 * 1024 * 1024;

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: fileSizeLimit }
});

const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const transactions = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const income = Number(String(row.Mthly_HH_Income || 0).replace(/,/g, ''));
        const expense = Number(String(row.Mthly_HH_Expense || 0).replace(/,/g, ''));
        const rent = Number(String(row.Emi_or_Rent_Amt || 0).replace(/,/g, ''));

        if (income) {
          transactions.push({
            date: 'CSV_ROW',
            description: 'Income',
            amount: income
          });
        }

        if (expense) {
          transactions.push({
            date: 'CSV_ROW',
            description: 'Expense',
            amount: -expense
          });
        }

        if (rent) {
          transactions.push({
            date: 'CSV_ROW',
            description: 'Rent',
            amount: -rent
          });
        }
      })
      .on('end', () => {
        resolve(transactions);
      })
      .on('error', reject);
  });

// Upload route
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.resolve(req.file.path);

    const transactions = await parseCsvFile(filePath);

    const unique = [];
    const seen = new Set();

    for (const t of transactions) {
      const key = `${t.date}|${t.description}|${t.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(t);
      }
    }

    res.json({ transactions: unique });
  } catch (err) {
    next(err);
  }
});

// Error handler
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `File too large. Max ${(fileSizeLimit / 1024 / 1024).toFixed(0)}MB allowed`
    });
  }
  next(error);
});

export default router;