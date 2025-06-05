import mongoose from 'mongoose';
import config from './config/index.js';
import { TriggerConfig } from './models/TriggerConfig.js';
import { pollSlackMessages } from './services/slackTriggerService.js';
import { logger } from './utils/logger.js';

(async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Worker connected to MongoDB');
  } catch (err) {
    logger.error(`Worker DB error: ${err}`);
    process.exit(1);
  }

  setInterval(async () => {
    try {
      const configs = await TriggerConfig.find({ isActive: true }).lean();
      for (const cfg of configs) {
        try {
          await pollSlackMessages(cfg.userId.toString(), cfg.settings.channelId);
        } catch (innerErr: any) {
          logger.error(`Polling error for user ${cfg.userId}: ${innerErr.message}`);
        }
      }
    } catch (err: any) {
      logger.error(`Worker main loop error: ${err.message}`);
    }
  }, 30 * 1000);
})();
