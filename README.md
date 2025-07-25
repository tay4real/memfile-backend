# Memfile Backend API Documentation

## Base URL

```
http://localhost:PORT/api
```

Replace `PORT` with your server's port.

---

## Authentication

Some endpoints may require authentication via JWT. Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Auth

#### Register

- **POST** `/auth/register`
- **Body:**
    ```json
    {
        "username": "string",
        "email": "string",
        "password": "string"
    }
    ```
- **Response:** User object and JWT token.

#### Login

- **POST** `/auth/login`
- **Body:**
    ```json
    {
        "email": "string",
        "password": "string"
    }
    ```
- **Response:** User object and JWT token.

---

### Users

#### Get Current User

- **GET** `/users/me`
- **Auth required**
- **Response:** Current user profile.

#### Update User

- **PUT** `/users/me`
- **Auth required**
- **Body:** Fields to update (e.g., `username`, `email`)
- **Response:** Updated user profile.

---

### Files

#### Upload File

- **POST** `/files/upload`
- **Auth required**
- **Form Data:** `file`
- **Response:** Uploaded file metadata.

#### List Files

- **GET** `/files`
- **Auth required**
- **Response:** Array of file metadata.

#### Get File

- **GET** `/files/:id`
- **Auth required**
- **Response:** File metadata or file download.

#### Delete File

- **DELETE** `/files/:id`
- **Auth required**
- **Response:** Success message.

---

## Error Handling

- Errors are returned as JSON:
    ```json
    {
        "error": "Error message"
    }
    ```

---

## Example Usage

```bash
curl -X POST http://localhost:PORT/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"password"}'
```

---

_Contact the maintainers for further details or questions._