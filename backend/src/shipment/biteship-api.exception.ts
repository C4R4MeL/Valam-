import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for Biteship API errors.
 * Thrown when the Biteship API returns an error in production mode,
 * instead of silently falling back to mock data.
 */
export class BiteshipApiException extends HttpException {
  constructor(
    message: string,
    public readonly biteshipStatusCode?: number,
    public readonly biteshipError?: string,
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'Biteship API Error',
        message,
        biteshipStatusCode,
        biteshipError,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
