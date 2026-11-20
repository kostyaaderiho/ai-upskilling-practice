import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

describe("POST /books", () => {
  it("creates a book", async () => {
    const res = await request(app).post("/books").send({ title: "Dune", author: "Frank Herbert" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Dune");
  });
});

describe("GET /books/:id", () => {
  it("returns the book", async () => {
    const created = await request(app).post("/books").send({ title: "Emma", author: "Jane Austen" });
    const res = await request(app).get(`/books/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it("returns 404 with detail when the book does not exist", async () => {
    const res = await request(app).get("/books/999999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });

  it("returns 404 for a non-numeric id", async () => {
    const res = await request(app).get("/books/abc");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });

  it("does not shadow /books/recent", async () => {
    const res = await request(app).get("/books/recent");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("DELETE /books/:id", () => {
  it("deletes the book", async () => {
    const created = await request(app).post("/books").send({ title: "Ulysses", author: "James Joyce" });
    const res = await request(app).delete(`/books/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});

    const after = await request(app).get(`/books/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it("returns 404 with detail when the book does not exist", async () => {
    const res = await request(app).delete("/books/999999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });

  it("returns 404 on a second delete of the same book", async () => {
    const created = await request(app).post("/books").send({ title: "Hamlet", author: "William Shakespeare" });
    await request(app).delete(`/books/${created.body.id}`);
    const res = await request(app).delete(`/books/${created.body.id}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });
});
