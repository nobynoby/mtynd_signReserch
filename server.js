const express = require('express');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(express.json());
app.use(express.static('public'));

// Google Sheets APIの設定
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// スプレッドシートからデータを取得するAPIエンドポイント
app.get('/api/sheets-data', async (req, res) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = process.env.SHEET_RANGE || 'Sheet1!A:Z'; // デフォルトはSheet1のA列からZ列

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({ data: [] });
    }

    // ヘッダー行を取得
    const headers = rows[0];
    // データ行を取得（ヘッダーを除く）
    const data = rows.slice(1).map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || '';
      });
      return item;
    });

    res.json({ data, headers });
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// メインページを提供
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`http://localhost:${PORT} にアクセスしてください`);
}); 