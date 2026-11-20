import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

describe("POST /books title rules", () => {
  it("accepts a normal title", async () => {
    const res = await request(app).post("/books").send({ title: "Dune", author: "Frank Herbert" });
    expect(res.status).toBe(200);
  });

  it("rejects an empty title", async () => {
    const res = await request(app).post("/books").send({ title: "", author: "Frank Herbert" });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("detail");
  });

  it("trims surrounding whitespace before saving the title", async () => {
    const res = await request(app).post("/books").send({ title: " Dune ", author: "Frank Herbert" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Dune");
  });

  it("rejects a whitespace-only title", async () => {
    const res = await request(app).post("/books").send({ title: "   ", author: "Frank Herbert" });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("detail");
  });

  it("rejects a title longer than 120 characters", async () => {
    const res = await request(app)
      .post("/books")
      .send({ title: "a".repeat(121), author: "Frank Herbert" });
    expect(res.status).toBe(422);
  });

  it("rejects a missing title field", async () => {
    const res = await request(app).post("/books").send({ author: "Frank Herbert" });
    expect(res.status).toBe(422);
  });

  it("rejects a numeric title", async () => {
    const res = await request(app).post("/books").send({ title: 42, author: "Frank Herbert" });
    expect(res.status).toBe(422);
  });
});
