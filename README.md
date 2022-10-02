# REST APIs | Cheat Sheet
> Concepts in Focus

- Get Books API
- Filtering Books
- REST APIs
- Why Rest Principles?
- REST API Principles

# 1. Get Books API

Let's see how to add **Filters** to **Get Books** API

**1.1 Filtering Books**

- Get a specific number of books
- Get books based on search query text
- Get books in the sorted order

**1.1.1 Get a specific number of books**

To get specific number of books in certain range we use **Limit** and **offset**.

**Offset** is used to specify the position from where rows are to be selected.

Limit is used to specify the number of rows. and many more...
Query parameters starts with **?** (question mark) followed by key value pairs separated by & (ampersand)

Example :
```
http://localhost:3000/books/?limit=2
http://localhost:3000/books/?offset=2&limit=3
http://localhost:3000/authors/20/books/?offset=2
```

## Note:
- The query parameters are used to sort/filter resources.
- The path parameters are used to identify a specific resource(s)

**1.1.2 Get books based on search query text**

We provide query text to **search_q** key
```
search_q = potter
```
**1.1.3 Get books in the sorted order**

We provide sorted order to order key

- Ascending: **ASC**
- DESCENDING: **DESC**

```
order = ASC
order = DESC
```
## Filtering GET Books API
```
app.get("/books/", async (request, response) => {
  const {
    offset = 2,
    limit = 5,
    order = "ASC",
    order_by = "book_id",
    search_q = "",
  } = request.query;
  const getBooksQuery = `
    SELECT
      *
    FROM
     book
    WHERE
     title LIKE '%${search_q}%'
    ORDER BY ${order_by} ${order}
    LIMIT ${limit} OFFSET ${offset};`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
```
## Note:
We can skip or add slash while appending query parameters to the URL

http://localhost:3000/books/?offset=2&limit=3 is same as http://localhost:3000/books?offset=2&limit=3

# 2. REST APIs

REST: `Representational State Transfer`

REST is a set of principles that define how Web standards, such as HTTP and URLs, are supposed to be used.

**2.1 Why Rest Principles?**

`Using Rest Principles improves application in various aspects like scalability, reliability etc`

**2.2 REST API Principles**

Providing unique ID to each resource
Using standard methods like `GET`, `POST`, `PUT`, and `DELETE`
Accept and Respond with `JSON`
and many more...

# Authentication

## Concepts in Focus

- Installing Third-party package bcrypt
- Goodreads APIs for Specified Users
   - Register User API
   - Login User API

## 1. Installing Third-party package bcrypt

Storing the passwords in plain text within a database is not a good idea since they can be misused, So Passwords should be encrypted

`bcrypt` package provides functions to perform operations like encryption, comparison, etc

- bcrypt.hash() uses various processes and encrypts the given password and makes it unpredictable
- bcrypt.compare() function compares the password entered by the user and hash against each other

## Installation Command

```
root@123:~/myapp# npm install bcrypt --save
```

## 2. Goodreads APIs for Specified Users

We need to maintain the list of users in a table and provide access only to that specified users

User needs to be registered and then log in to access the books

- Register User API
- Login User API

**2.1 Register User API**

Here we check whether the user is a new user or an existing user.
Returns "User Already exists" for existing user else for a new user we store encrypted password in the DB

```
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with ${newUserId}`);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
```
**2.2 Login User API**

Here we check whether the user exists in DB or not.
Returns "Invalid User" if the user doesn't exist else we compare the given password with the DB user password
```
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
```
## Status Codes
| Status Codes	| Status Text ID |
| ------------- | -------------- |
|      200     	|       OK       |
|      204	    |   No Response  |
|      301	    |Moved Permanently|
|      400	    |   Bad Request   |
|      403	    |   Forbidden     |
|      401	    |   Unauthorized  |

# Authentication | Part 2 |

- Authentication Mechanisms
- Token Authentication mechanism
  - Access Token
  - How Token Authentication works?
- JWT
  - How JWT works?
  - JWT Package
- Login User API by generating the JWT Token
- How to pass JWT Token?
- Get Books API with Token Authentication

# 1. Authentication Mechanisms

To check whether the user is logged in or not we use different Authentication mechanisms

Commonly used Authentication mechanisms:

- Token Authentication
- Session Authentication

# 2. Token Authentication mechanism

We use the Access Token to verify whether the user is logged in or not

**2.1 Access Token**

Access Token is a set of characters which are used to identify a user

**Example:**

It is used to verify whether a user is Valid/Invalid

**2.2 How Token Authentication works?**

- Server generates token and certifies the client
- Client uses this token on every subsequent request
- Client don’t need to provide entire details every time
# 3. JWT
`JSON Web Token` is a standard used to create access tokens for an application
This access token can also be called as JWT Token

 **3.1 How JWT works?**

- **Client**: Login with username and password
- **Server**: Returns a JWT Token
- **Client**: Sends JWT Token while requesting
- **Server**: Sends Response to the client

**3.2 JWT Package**

`jsonwebtoken` package provides `jwt.sign` and `jwt.verify` functions

- `jwt.sign()` function takes payload, secret key, options as arguments and generates JWTToken out of it
- `jwt.verify()` verifies jwtToken and if it’s valid, returns payload. Else, it throws an error

```
root@123root@123:.../myapp# npm install jsonwebtoken
```

# 4. Login User API by generating the JWT Token
When the user tries to log in, verify the Password.
Returns **JWT Token** if the password matches else return **Invalid Password** with status code **400**.
```
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
```

# 5. How to pass JWT Token?
We have to add an authorization header to our request and the JWT Token is passed as a **Bearer token**
```
GET http://localhost:3000/books?offset=2&limit=3&search_q=the&order_by=price&order=DESC
Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoicmFodWwiLCJnZW5kZXIiOiJNYWxlIiwibG9jYXRpb24iOiJoeWRlcmFiYWQiLCJpYXQiOjE2MTc0MzI0MDd9.Eqevw5QE70ZAVrmOZUc6pflUbeI0ffZUmQLDHYplU8g
```
# 6. Get Books API with Token Authentication
Here we check for JWT Token from Headers.
If JWT Token is not present it returns an **Invalid Access Token** with status code **401** else verify the **JWT Token**.
```
app.get("/books/", (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid Access Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.send("Invalid Access Token");
      } else {
        const getBooksQuery = `
            SELECT
              *
            FROM
             book
            ORDER BY
              book_id;`;
        const booksArray = await db.all(getBooksQuery);
        response.send(booksArray);
      }
    });
  }
});
```
# Authentication | Part 3 | Cheat Sheet
- Middleware functions
  - Multiple Middleware functions
- Logger Middleware Implementation
  - Defining a Middleware Function
  - Logger Middleware Function
  - Get Books API with Logger Middleware
- Authenticate Token Middleware
- Get Books API with Authenticate Token Middleware
- Passing data from Authenticate Token Middleware
- Get User Profile API with Authenticate Token Middleware

# 1. Middleware functions
Middleware is a special kind of function in Express JS which accepts the request from

- the user (or)
- the previous middleware

After processing the request the middleware function

- sends the response to another middleware (or)
- calls the API Handler (or)
- sends response to the user

```
app.method(Path, middleware1, handler);
```
Example
```
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
```
It is a **built-in middleware function** it recognizes the incoming request object as a JSON object, parses it, and then calls handler in **every API call**

**1.1 Multiple Middleware functions**

We can pass multiple middleware functions
```
app.method(Path, middleware1, middleware2, handler);
```
# 2. Logger Middleware Implementation
**2.1 Defining a Middleware Function**
```
const middlewareFunction = (request, response, next) => {};
```
**2.2 Logger Middleware Function**
```
const logger = (request, response, next) => {
  console.log(request.query);
  next();
};
```
The next parameter is a function passed by Express JS which, when invoked, executes the next succeeding function

**2.3 Get Books API with Logger Middleware**

```
app.get("/books/", logger, async (request, response) => {
  const getBooksQuery = `
   SELECT
    *
   FROM
    book
   ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
```
# 3. Authenticate Token Middleware
In Authenticate Token Middleware we will verify the JWT Token

```
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};
```
# 4. Get Books API with Authenticate Token Middleware
Let's Pass Authenticate Token Middleware to Get Books API
```
app.get("/books/", authenticateToken, async (request, response) => {
  const getBooksQuery = `
   SELECT
    *
   FROM
    book
   ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
```
# 5. Passing data from Authenticate Token Middleware
We cannot directly pass data to the next handler, but we can send data through the request object
```
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};
```
# 6. Get User Profile API with Authenticate Token Middleware
We can access request variable from the request object
```
app.get("/profile/", authenticateToken, async (request, response) => {
  let { username } = request;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const userDetails = await db.get(selectUserQuery);
  response.send(userDetails);
});
```
