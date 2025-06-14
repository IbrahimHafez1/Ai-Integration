import { Schema, model, Document, ObjectId } from 'mongoose';

export interface ICRMStatusLog extends Document {
  leadLogId: ObjectId;
  status: 'SUCCESS' | 'FAILURE';
  userId: ObjectId;
  rawResponse: any;
  createdAt: Date;
  updatedAt: Date;
}

const crmStatusLogSchema = new Schema<ICRMStatusLog>(
  {
    leadLogId: { type: Schema.Types.ObjectId, ref: 'LeadLog', required: true, index: true },
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], required: true },
    rawResponse: { type: Schema.Types.Mixed },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const CRMStatusLog = model<ICRMStatusLog>('CRMStatusLog', crmStatusLogSchema);
