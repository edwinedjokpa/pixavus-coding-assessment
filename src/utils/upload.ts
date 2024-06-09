/* eslint-disable prettier/prettier */
import { NotFoundException } from '@nestjs/common';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { finished } from 'stream/promises';

export const uploadFileStream = async (readStream, uploadDir, filename) => {
  const fileName = filename;
  const filePath = join(uploadDir, fileName);

  mkdirSync(uploadDir, { recursive: true });

  const inStream = readStream();
  const outStream = createWriteStream(filePath);
  inStream.pipe(outStream);

  try {
    await finished(outStream);
    return filePath;
  } catch (error) {
    console.log(error.message);
    throw new NotFoundException(error.message);
  }
};
