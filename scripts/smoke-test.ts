import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../dist/src/app.module.js";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(0, "127.0.0.1");
  const baseUrl = await app.getUrl();

  const health = await requestJson<{ status: string }>(`${baseUrl}/api/health`);
  const offers = await requestJson<unknown[]>(`${baseUrl}/api/offers`);
  const simulation = await requestJson<{ count: number }>(`${baseUrl}/api/simulations/auto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usage: "Promenade & Affaires",
      power: "7-10 CV",
      energy: "Essence",
      duration: "1 AN",
    }),
  });

  console.log(`health=${health.status}`);
  console.log(`offers=${offers.length}`);
  console.log(`simulationResults=${simulation.count}`);

  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
