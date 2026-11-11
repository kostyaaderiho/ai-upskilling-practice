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

describe("GET /books/:id", () => {
  it("returns a book by id", async () => {
    const created = await request(app).post("/books").send({ title: "Neuromancer", author: "William Gibson" });
    const id = created.body.id as number;

    const res = await request(app).get(`/books/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it("returns 404 for a missing book", async () => {
    const res = await request(app).get("/books/999999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });
});

describe("DELETE /books/:id", () => {
  it("deletes an existing book", async () => {
    const created = await request(app).post("/books").send({ title: "Солярис", author: "Станислав Лем" });
    const id = created.body.id as number;

    const res = await request(app).delete(`/books/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);

    const again = await request(app).delete(`/books/${id}`);
    expect(again.status).toBe(404);
  });

  it("returns 404 for a missing book", async () => {
    const res = await request(app).delete("/books/999999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });
});
