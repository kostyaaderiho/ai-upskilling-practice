import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

const author = "Фрэнк Герберт";

function create(body: Record<string, unknown>): request.Test {
  return request(app).post("/books").send(body);
}

describe("POST /books title validation", () => {
  it("accepts a normal title", async () => {
    const res = await create({ title: "Дюна", author });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Дюна");
  });

  it("trims surrounding whitespace and stores the trimmed title", async () => {
    const res = await create({ title: " Дюна ", author });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Дюна");
  });

  it("accepts a title of exactly 120 characters", async () => {
    const res = await create({ title: "a".repeat(120), author });
    expect(res.status).toBe(200);
  });

  it.each([
    ["an empty string", ""],
    ["a whitespace-only string", " "],
  ])("rejects %s with 422 and { detail }", async (_name, title) => {
    const res = await create({ title, author });
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ detail: expect.any(String) });
  });

  it("rejects a title longer than 120 characters with 422 and { detail }", async () => {
    const res = await create({ title: "a".repeat(121), author });
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ detail: expect.any(String) });
  });

  it("rejects a missing title with 422 and { detail }", async () => {
    const res = await create({ author });
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ detail: expect.any(String) });
  });

  it("rejects a numeric title with 422 and { detail }", async () => {
    const res = await create({ title: 123, author });
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ detail: expect.any(String) });
  });
});
