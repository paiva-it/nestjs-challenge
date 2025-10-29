import * as mongoose from 'mongoose';
import { Record, RecordSchema } from './src/api/schemas/record.schema';
import * as fs from 'fs';
import * as readline from 'readline';
import { MongoConfig } from 'src/configuration/mongodb.config';

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

        await mongoose.connect(MongoConfig.mongoUrl);

        if (answer.toLowerCase() === 'y') {
          await recordModel.deleteMany({});
          console.log('Existing collection cleaned up.');
        }

        const records = await recordModel.insertMany(data);
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
