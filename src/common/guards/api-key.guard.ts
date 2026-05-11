import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

/**
 * Simple API-key guard for admin / write endpoints.
 * Checks the `x-api-key` header against the ADMIN_API_KEY env variable.
 *
 * Usage: decorate controller methods with @UseGuards(ApiKeyGuard)
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const apiKey = request.headers["x-api-key"];
    const expected = process.env.ADMIN_API_KEY;

    if (!expected) {
      throw new UnauthorizedException("Server misconfiguration: ADMIN_API_KEY is not set");
    }

    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException("Invalid or missing API key");
    }

    return true;
  }
}
