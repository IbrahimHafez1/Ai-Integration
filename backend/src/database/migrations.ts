import mongoose from 'mongoose';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export async function fixGmailIndex() {
  try {
    logger.info('Starting Gmail index migration...');

    // Get the User collection
    const collection = User.collection;

    // Check if gmail_1 index exists
    const indexes = await collection.listIndexes().toArray();
    const gmailIndex = indexes.find((index) => index.name === 'gmail_1');

    if (gmailIndex) {
      logger.info('Found existing gmail_1 index, dropping it...');
      await collection.dropIndex('gmail_1');
      logger.info('Successfully dropped gmail_1 index');
    }

    // Create new sparse unique index for gmail
    logger.info('Creating new sparse unique index for gmail...');
    await collection.createIndex(
      { gmail: 1 },
      {
        unique: true,
        sparse: true,
        name: 'gmail_1_sparse',
      },
    );
    logger.info('Successfully created new sparse gmail index');

    // Clean up any duplicate null values
    logger.info('Cleaning up duplicate null gmail values...');
    const duplicateNulls = await collection.find({ gmail: null }).toArray();

    if (duplicateNulls.length > 1) {
      // Keep the first one, remove gmail field from others
      const idsToUpdate = duplicateNulls.slice(1).map((doc) => doc._id);
      await collection.updateMany({ _id: { $in: idsToUpdate } }, { $unset: { gmail: 1 } });
      logger.info(`Cleaned up ${idsToUpdate.length} duplicate null gmail values`);
    }

    logger.info('Gmail index migration completed successfully');
  } catch (error) {
    logger.error('Error during Gmail index migration:', error);
    throw error;
  }
}

export async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    await fixGmailIndex();
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}
