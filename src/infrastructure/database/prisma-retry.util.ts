import { Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientInitializationError } from '@prisma/client/runtime/library';

const CONNECTION_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);
const MAX_RETRIES = 3;

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: string,
  logger: Logger,
  attempt = 1,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const isConnectionError =
      error instanceof PrismaClientInitializationError ||
      (error instanceof PrismaClientKnownRequestError && CONNECTION_ERROR_CODES.has(error.code));

    if (!isConnectionError || attempt >= MAX_RETRIES) {
      logger.error(`DB operation failed [${context}] attempt ${attempt}`, (error as Error).message);
      throw error;
    }

    const backoff = attempt * 300;
    logger.warn(`DB connection error [${context}] attempt ${attempt}/${MAX_RETRIES}, retrying in ${backoff}ms`);
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return executeWithRetry(operation, context, logger, attempt + 1);
  }
}
