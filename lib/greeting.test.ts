import { describe, expect, it } from "vitest";
import { greetingForTime } from "@/lib/greeting";

function at(hours: number, minutes: number): Date {
  return new Date(2026, 0, 1, hours, minutes, 0);
}

describe("greetingForTime — hero card greeting, exact boundaries", () => {
  it("00:00-09:00 -> Selamat Pagi", () => {
    expect(greetingForTime(at(0, 0))).toBe("Selamat Pagi");
    expect(greetingForTime(at(6, 30))).toBe("Selamat Pagi");
    expect(greetingForTime(at(9, 0))).toBe("Selamat Pagi");
  });

  it("09:01-15:00 -> Selamat Siang", () => {
    expect(greetingForTime(at(9, 1))).toBe("Selamat Siang");
    expect(greetingForTime(at(12, 0))).toBe("Selamat Siang");
    expect(greetingForTime(at(15, 0))).toBe("Selamat Siang");
  });

  it("15:01-18:00 -> Selamat Sore", () => {
    expect(greetingForTime(at(15, 1))).toBe("Selamat Sore");
    expect(greetingForTime(at(16, 30))).toBe("Selamat Sore");
    expect(greetingForTime(at(18, 0))).toBe("Selamat Sore");
  });

  it("18:01-23:59 -> Selamat Malam", () => {
    expect(greetingForTime(at(18, 1))).toBe("Selamat Malam");
    expect(greetingForTime(at(21, 0))).toBe("Selamat Malam");
    expect(greetingForTime(at(23, 59))).toBe("Selamat Malam");
  });
});
