import * as mongoose from 'mongoose';
import { Record, RecordSchema } from './src/api/schemas/record.schema';
import * as fs from 'fs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { generateNgrams } from 'src/api/common/utils/generate-ngrams.util';

dotenv.config();

function computeSearchTokens(doc: Partial<Record>): string[] {
  const tokens: string[] = [];

  if (doc.artist) tokens.push(...generateNgrams(doc.artist));
  if (doc.album) tokens.push(...generateNgrams(doc.album));
  if (doc.category) tokens.push(...generateNgrams(doc.category));
  if (doc.format) tokens.push(...generateNgrams(doc.format));

  return [...new Set(tokens)];
}

async function setupDatabase() {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      'Do you want to clean up the existing records collection? (Y/N): ',
      async (answer) => {
        rl.close();

        const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
        const recordModel: mongoose.Model<Record> = mongoose.model<Record>(
          'Record',
          RecordSchema,
        );

        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
          console.error(
            'MongoDB connection URL is undefined. Please create a .env file with MONGO_URL, e.g. MONGO_URL=mongodb://localhost:27017/records',
          );
          process.exit(1);
        }

        await mongoose.connect(mongoUrl);

        if (answer.toLowerCase() === 'y') {
          await recordModel.deleteMany({});
          console.log('Existing collection cleaned up.');
        }

        const dataWithTokens = data.map((doc: Partial<Record>) => ({
          ...doc,
          searchTokens: computeSearchTokens(doc),
        }));

        const records = await recordModel.insertMany(dataWithTokens);
        console.log(`Inserted ${records.length} records successfully!`);

        mongoose.disconnect();
      },
    );
  } catch (error) {
    console.error('Error setting up the database:', error);
    mongoose.disconnect();
  }
}

setupDatabase();
