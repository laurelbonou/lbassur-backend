import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      service: "lbassur-api",
      timestamp: new Date().toISOString(),
    };
  }
}
