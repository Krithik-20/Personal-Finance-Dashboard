import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import os from 'os';
import path from 'path';

const router = express.Router();

const parseSize = (value, fallback) => {
  if (!value) return fallback;

  const normalized = String(value).trim().toLowerCase();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const match = normalized.match(/^(\d+)(kb|mb|gb)$/);

  if (!match) return fallback;

  const number = Number(match[1]);

  switch (match[2]) {
    case 'kb':
      return number * 1024;
    case 'mb':
      return number * 1024 * 1024;
    case 'gb':
      return number * 1024 * 1024 * 1024;
    default:
      return fallback;
  }
};

const fileSizeLimit = parseSize(
  process.env.MAX_UPLOAD_SIZE,
  200 * 1024 * 1024
);

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: fileSizeLimit
  }
});

const dateFields = [
  'date',
  'transaction date',
  'transaction_date'
];

const descriptionFields = [
  'description',
  'details',
  'merchant',
  'payee',
  'narrative'
];

const amountFields = [
  'amount',
  'value',
  'transaction amount',
  'transaction_amount',
  'debit',
  'credit',
  'income',
  'expenditure'
];

const headerAliases = {
  date: 'date',
  'transaction date': 'date',
  'transaction_date': 'date',
  transactiondate: 'date',

  description: 'description',
  details: 'description',
  merchant: 'description',
  payee: 'description',
  narrative: 'description',

  amount: 'amount',
  value: 'amount',
  'transaction amount': 'amount',
  transaction_amount: 'amount'
};

const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const transactions = [];
    let headersValidated = false;
    let rowIndex = 0;

    const parser = csvParser({
      mapHeaders: ({ header }) => {
        const normalized = String(header).toLowerCase().trim();
        return headerAliases[normalized] || normalized;
      }
    });

    fs.createReadStream(filePath)
      .pipe(parser)
      .on('headers', (headers) => {
        headersValidated = true;
        console.log('CSV Headers:', headers);
      })
      .on('data', (row) => {
        rowIndex++;

        const getValue = (fields) => {
          for (const field of fields) {
            if (
              row[field] !== undefined &&
              row[field] !== null &&
              String(row[field]).trim() !== ''
            ) {
              return String(row[field]).trim();
            }
          }

          return '';
        };

        const date = getValue(dateFields);
        const description = getValue(descriptionFields);

        let amount = NaN;

        for (const field of amountFields) {
          if (
            row[field] !== undefined &&
            row[field] !== null &&
            String(row[field]).trim() !== ''
          ) {
            const parsed = Number(
              String(row[field]).replace(/,/g, '')
            );

            if (!Number.isNaN(parsed)) {
              amount = parsed;
              break;
            }
          }
        }

        if (Number.isNaN(amount)) {
          for (const key of Object.keys(row)) {
            const parsed = Number(
              String(row[key]).replace(/,/g, '')
            );

            if (!Number.isNaN(parsed)) {
              amount = parsed;
              break;
            }
          }
        }

        if (Number.isNaN(amount)) {
          return;
        }

        transactions.push({
          date: date || `Row ${rowIndex}`,
          description: description || 'Imported Transaction',
          amount
        });
      })
      .on('end', () => {
        if (!headersValidated) {
          reject(
            new Error('CSV file appears malformed or empty.')
          );
          return;
        }

        if (!transactions.length) {
          reject(
            new Error('CSV contains no usable numeric data.')
          );
          return;
        }

        resolve(transactions);
      })
      .on('error', (error) => reject(error));
  });

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please choose a CSV file.'
      });
    }

    const filePath = path.resolve(req.file.path);

    const stats = fs.statSync(filePath);

    if (stats.size === 0) {
      return res.status(400).json({
        error: 'Uploaded file is empty.'
      });
    }

    const transactions = await parseCsvFile(filePath);

    const unique = [];
    const seen = new Set();

    for (const transaction of transactions) {
      const key = `${transaction.date}|${transaction.description}|${transaction.amount}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(transaction);
      }
    }

    res.json({
      transactions: unique
    });
  } catch (error) {
    next(error);
  }
});

router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `Uploaded file is too large. Maximum allowed size is ${Math.round(
        fileSizeLimit / 1024 / 1024
      )} MB.`
    });
  }

  next(error);
});

export default router;
