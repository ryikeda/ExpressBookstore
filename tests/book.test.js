process.env.NODE_ENV = "test";

const app = require("../app");
const db = require("../db");
const request = require("supertest");

let bookIsbn;

beforeEach(async () => {
  const result = await db.query(`
  INSERT INTO 
    books (isbn, amazon_url,author,language,pages,publisher,title,year)   
    VALUES(
      '11111', 
      'https://amazon.com/testBook', 
      'John', 
      'English', 
      500,  
      'Test publishers', 
      'Testing with code', 2020) 
    RETURNING isbn`);
  bookIsbn = result.rows[0].isbn;
});

afterEach(async () => {
  await db.query("DELETE FROM books");
});
afterAll(async () => {
  await db.end();
});

// GET Routes
describe("GET /books", () => {
  test("Gets a list of one book", async () => {
    const res = await request(app).get(`/books`);
    const books = res.body.books;
    expect(books).toHaveLength(1);
    expect(books[0].isbn).toEqual(bookIsbn);
    expect(books[0].year).toEqual(2020);
  });
});

describe("GET /books/:isbn", () => {
  test("Gets a single book by isbn", async () => {
    const res = await request(app).get(`/books/${bookIsbn}`);
    const book = res.body.book;
    expect(book.isbn).toEqual(bookIsbn);
    expect(book.year).toEqual(2020);
  });

  test("Responds with 404 if not found", async () => {
    const res = await request(app).get(`/books/0`);
    expect(res.statusCode).toBe(404);
  });
});
