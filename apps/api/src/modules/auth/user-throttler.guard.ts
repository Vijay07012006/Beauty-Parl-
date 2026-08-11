import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user && req.user.id) {
      return `user-${req.user.id}`;
    }
    return req.ips?.length ? req.ips[0] : req.ip;
  }

  getRequestResponse(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    return { req, res };
  }
}
