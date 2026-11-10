import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

describe("POST /books", () => {
  it("creates a book", async () => {
    const res = await request(app).post("/books").send({ title: "Дюна", author: "Фрэнк Герберт" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Дюна");
  });
});
