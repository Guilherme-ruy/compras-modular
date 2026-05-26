import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantAls } from './tenant.als';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch (e) {
        // ignore
      }
    }

    if (tenantId) {
      tenantAls.run({ tenantId }, () => {
        next();
      });
    } else {
      next();
    }
  }
}
