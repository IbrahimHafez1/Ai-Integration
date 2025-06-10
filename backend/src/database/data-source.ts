import { connect, set } from 'mongoose';

export const connectDB = async (uri: string, debug: boolean = false) => {
  set('strictQuery', false);
  set('debug', debug);
  await connect(uri!);
};
