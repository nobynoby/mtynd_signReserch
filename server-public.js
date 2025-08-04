const express = require('express');
const path = require('path');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(express.json());
app.use(express.static('public'));

// CSVデータを取得する関数
function fetchCSVData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// CSVをパースする関数
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] || '';
    });
    return item;
  });
  
  return { headers, data };
}

// 公開スプレッドシートからデータを取得するAPIエンドポイント
app.get('/api/sheets-data', async (req, res) => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME || 'Sheet1';
    
    // 公開スプレッドシートのCSV URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    
    console.log('CSV URL:', csvUrl);
    
    const csvData = await fetchCSVData(csvUrl);
    const parsedData = parseCSV(csvData);
    
    res.json(parsedData);
  } catch (error) {
    console.error('Error fetching data from public spreadsheet:', error);
    res.status(500).json({ 
      error: 'データの取得に失敗しました',
      details: error.message 
    });
  }
});

// メインページを提供
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`http://localhost:${PORT} にアクセスしてください`);
  console.log('公開スプレッドシート方式を使用しています');
}); 