import { Document, Schema, model } from 'mongoose';

export interface ILeadLog extends Document {
  slackUserId: string;
  eventType: string;
  text: string;
  channelId: string;
  createdAt: Date;
}

const leadLogSchema = new Schema<ILeadLog>(
  {
    slackUserId: { type: String, required: true, index: true },
    eventType: { type: String, required: true },
    text: { type: String, required: true },
    channelId: { type: String, required: true },
  },
  { timestamps: true },
);

export const LeadLog = model<ILeadLog>('LeadLog', leadLogSchema);
