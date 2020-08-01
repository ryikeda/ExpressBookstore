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

// POST Route
describe("POST /books", () => {
  const testBook2 = {
    isbn: "22222",
    amazon_url: "https://amazon.com/testBook2",
    author: "Tanaka",
    language: "Japanese",
    pages: 600,
    publisher: "Japan Books",
    title: "Tanaka book",
    year: 2000,
  };

  test("Creates a new book", async () => {
    const res = await request(app).post(`/books`).send(testBook2);
    const book = res.body.book;
    expect(res.statusCode).toBe(201);
    expect(book).toHaveProperty("isbn");
    expect(book.isbn).toEqual(testBook2.isbn);
  });

  test("Prevents creating a duplicated isbn", async () => {
    const testDuplicateIsbn = { ...testBook2 };
    testDuplicateIsbn.isbn = bookIsbn;
    const res = await request(app).post(`/books`).send(testDuplicateIsbn);
    expect(res.statusCode).toBe(400);
  });

  test("Prevents creating book without isbn", async () => {
    const testNoIsbn = { ...testBook2 };
    delete testNoIsbn.isbn;
    const res = await request(app).post(`/books`).send(testNoIsbn);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.error).toContain('instance requires property "isbn"');
  });

  test("Prevents creating book without author", async () => {
    const testNoAuthor = { ...testBook2 };
    delete testNoAuthor.author;
    const res = await request(app).post(`/books`).send(testNoAuthor);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.error).toContain(
      'instance requires property "author"'
    );
  });

  test("Prevents creating book without language", async () => {
    const testNolanguage = { ...testBook2 };
    delete testNolanguage.language;
    const res = await request(app).post(`/books`).send(testNolanguage);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.error).toContain(
      'instance requires property "language"'
    );
  });

  test("Prevents creating book without pages", async () => {
    const testNopages = { ...testBook2 };
    delete testNopages.pages;
    const res = await request(app).post(`/books`).send(testNopages);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.error).toContain(
      'instance requires property "pages"'
    );
  });

  test("Prevents creating book without title", async () => {
    const testNotitle = { ...testBook2 };
    delete testNotitle.title;
    const res = await request(app).post(`/books`).send(testNotitle);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.error).toContain(
      'instance requires property "title"'
    );
  });

  test("Prevents creating book without year", async () => {
    const testNoyear = { ...testBook2 };
    delete testNoyear.year;
    const res = await request(app).post(`/books`).send(testNoyear);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.error).toContain('instance requires property "year"');
  });
});

// PUT Route
describe("PUT /books/:id", async () => {
  const updateBook = {
    amazon_url: "https://amazon.com/updateBook",
    author: "Updated Author",
    language: "Updated Language",
    pages: 1000,
    publisher: "Updated Publisher",
    title: "Updated title",
    year: 2000,
  };

  test("Updates a single book", async () => {
    const res = await request(app).put(`/books/${bookIsbn}`).send(updateBook);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.author).toBe(updateBook.author);
    expect(res.body.book.amazon_url).toBe(updateBook.amazon_url);
    expect(res.body.book.language).toBe(updateBook.language);
    expect(res.body.book.pages).toBe(updateBook.pages);
    expect(res.body.book.publisher).toBe(updateBook.publisher);
    expect(res.body.book.title).toBe(updateBook.title);
    expect(res.body.book.year).toBe(updateBook.year);
  });

  test("Responds with 404 if not found", async () => {
    const res = await request(app).put(`/books/0`).send(updateBook);
    expect(res.statusCode).toBe(404);
  });
});
