import { Request, Response } from "express";

export const Status = async (req: Request, res: Response) => {
  res.status(200).json({ status: "online" });
};
