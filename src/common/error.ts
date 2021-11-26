import { Request, Response, NextFunction } from "express";

export class APIError extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export const ErrorHandler = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "An error has occurred";
  res.status(status).json({
    status,
    message,
  });
};
