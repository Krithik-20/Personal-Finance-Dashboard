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
  if (/^\d+$/.test(normalized)) return Number(normalized);
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

const fileSizeLimit = parseSize(process.env.MAX_UPLOAD_SIZE, 200 * 1024 * 1024);
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: fileSizeLimit } });
const dateFields = ['date', 'transaction date', 'transaction_date'];
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
  'debit',
  'credit',
  'income',
  'expenditure'
];
const headerAliases = {
  date: 'date',
  'transaction date': 'date',
  'transaction_date': 'date',
  'transactiondate': 'date',
  description: 'description',
  details: 'description',
  merchant: 'description',
  payee: 'description',
  narrative: 'description',
  amount: 'amount',
  value: 'amount',
  'transaction amount': 'amount',
  'transaction_amount': 'amount',
  debit: 'amount',
  credit: 'amount'
};
const summaryColumns = {
  mthly_hh_income: { description: 'Monthly Household Income', sign: 1 },
  mthly_hh_expense: { description: 'Monthly Household Expense', sign: -1 },
  emi_or_rent_amt: { description: 'EMI / Rent', sign: -1 },
  annual_hh_income: { description: 'Annual Household Income', sign: 1 },
  highest_qualified_member: { description: 'Highest Qualified Member', sign: 0 },
  no_of_earning_members: { description: 'Number of Earning Members', sign: 0 }
};

const parseNumeric = (value) => {
  if (value === undefined || value === null) return NaN;
  const normalized = String(value).trim().replace(/,/g, '');
  return Number(normalized);
};

const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const transactions = [];
    let headersValidated = false;
    let rowIndex = 0;
    let useSummaryMode = false;

    const parser = csvParser({
      mapHeaders: ({ header }) => {
        const normalized = header.toLowerCase().trim();
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
        rowIndex += 1;
        const findValue = (fields) => {
           for (const field of fields) {
             if (row[field] !== undefined && row[field] !== '') {
              return String(row[field]).trim();
            }
          }
          return '';
        };
        const date = findValue(dateFields);
        const description = findValue(descriptionFields);
        let amount = NaN;
        for (const field of amountFields) {
          if (row[field] !== undefined && row[field] !== '') {
            amount = Number(String(row[field]).replace(/,/g, ''));
            if (!Number.isNaN(amount)) break;
          }
        }
        const debitRaw = (row.debit || '').trim();
        const creditRaw = (row.credit || '').trim();
        const incomeRaw = (row.income || '').trim();
        const expenditureRaw = (row.expenditure || '').trim();

        if (!date && !description && !amountRaw && !debitRaw && !creditRaw && !incomeRaw && !expenditureRaw && !Object.keys(row).some((key) => summaryColumns[key.toLowerCase()])) {
          return;
        }

        if (useSummaryMode) {
          const summaryDate = date || `Summary Row ${rowIndex}`;
          let addedSummary = false;
          for (const key of Object.keys(row)) {
            const normalized = key.toLowerCase().trim();
            const settings = summaryColumns[normalized];
            if (!settings) continue;
            const value = parseNumeric(row[key]);
            if (Number.isNaN(value) || settings.sign === 0) continue;
            transactions.push({
              date: summaryDate,
              description: settings.description,
              amount: value * settings.sign
            });
            addedSummary = true;
          }
          if (addedSummary) {
            return;
          }
        }

        let amount = Number(amountRaw);
        if (Number.isNaN(amount) || amountRaw === '') {
          if (debitRaw !== '') {
            amount = -Math.abs(Number(debitRaw));
          } else if (creditRaw !== '') {
            amount = Number(creditRaw);
          } else if (incomeRaw !== '' || expenditureRaw !== '') {
            const income = Number(incomeRaw) || 0;
            const expenditure = Number(expenditureRaw) || 0;
            amount = income - expenditure;
          }
        }

        
        if (!Number.isNaN(amount)) {
          transactions.push({
            date: date || `Row ${rowIndex}`,
            description: description || 'Imported Transaction',
            amount
          });
        }
      })
      .on('end', () => {
        if (!headersValidated) {
          reject(new Error('CSV file appears malformed or empty.'));
          return;
        }
        if (!transactions.length) {
          reject(new Error('CSV is empty or contains no valid transactions.'));
          return;
        }
        resolve(transactions);
      })
      .on('error', (error) => reject(error));
  });

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please choose a CSV file.' });
    }

    const filePath = path.resolve(req.file.path);
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
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

    res.json({ transactions: unique });
  } catch (error) {
    next(error);
  }
});

router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `Uploaded file is too large. Maximum allowed size is ${Math.round(fileSizeLimit / 1024 / 1024)} MB.`
    });
  }
  next(error);
});

export default router;
