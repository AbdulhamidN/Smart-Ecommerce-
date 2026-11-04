import { Request, Response, NextFunction } from 'express';
import { Role, SellerStatus } from '@prisma/client';

export const requireApprovedSeller = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (req.user.role !== Role.SELLER) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied: Seller account required',
      },
    });
  }

  if (!req.user.seller || req.user.seller.status !== SellerStatus.APPROVED) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Seller account is not approved or pending review',
      },
    });
  }

  next();
};

export default requireApprovedSeller;
