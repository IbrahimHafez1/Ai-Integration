import { Schema, model, Document, ObjectId } from 'mongoose';

export interface ITriggerConfig extends Document {
  userId: ObjectId;
  settings: { channelId: string };
  isActive: boolean;
}

const triggerConfigSchema = new Schema<ITriggerConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    settings: {
      channelId: { type: String, required: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const TriggerConfig = model<ITriggerConfig>('TriggerConfig', triggerConfigSchema);
