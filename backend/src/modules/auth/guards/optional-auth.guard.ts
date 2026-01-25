import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Determine if we have a user, ignoring any errors (like TokenExpiredError)
    // If error or no user, treat as guest (return null)
    if (err || !user) {
      return null;
    }
    return user;
  }
}
