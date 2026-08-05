import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports that the service is healthy", () => {
    expect(new HealthController().check()).toEqual({
      status: "ok",
      service: "vr-digital-calling-api",
    });
  });
});

