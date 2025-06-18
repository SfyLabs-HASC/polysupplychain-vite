// File: /api/upload.js (con log di debug)

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { formidable } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3Client = new S3Client({
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.VITE_FILEBASE_ACCESS_KEY,
    secretAccessKey: process.env.VITE_FILEBASE_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.VITE_FILEBASE_BUCKET_NAME;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form data.' });
    }

    try {
      const file = files.file[0];
      const companyName = fields.companyName[0] || 'AziendaGenerica';
      const objectKey = `${companyName}/${Date.now()}_${file.originalFilename}`;

      const fileContent = fs.readFileSync(file.filepath);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: fileContent,
        ContentType: file.mimetype,
      });

      const result = await s3Client.send(command);

      // --- RIGA DI DEBUG FONDAMENTALE ---
      // Stampiamo l'intera risposta ricevuta da Filebase nei log di Vercel
      console.log("RISPOSTA COMPLETA DA FILEBASE:", JSON.stringify(result, null, 2));
      // ------------------------------------

      const cid = result.$metadata.httpHeaders?.['x-amz-meta-cid'] || result.ETag?.replace(/"/g, "");

      if (!cid) {
        return res.status(500).json({ error: 'CID not found in Filebase response.' });
      }
      
      return res.status(200).json({ cid });

    } catch (error) {
      console.error('Upload Error:', error);
      return res.status(500).json({ error: 'File upload failed.', details: error.message });
    }
  });
}