# 📘 API Documentation - Memfile Electronic Document Management System

Welcome to the official API documentation for the **MemFile Electronc Document Management System (Memfile EDMS)**. This system handles user accounts, general file uploads, mail correspondence (incoming/outgoing), authentication, and administrative MDA (Ministries, Departments, and Agencies) data.

---

## 📂 Table of Contents

- [Base URL](#base-url)
- [Tech Stack](#tech-stack)
- [Available Routes](#available-routes)
- [Authentication](#authentication)
- [Swagger Docs](#swagger-documentation)
- [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 🌐 Base URL

```
https://yourdomain.com/api
```

Or locally:

```
http://localhost:4000/api
```

---

## 🛠 Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** (Mongoose ODM)
- **Cloudinary** (for file & image uploads)
- **JWT** authentication
- **Swagger** for API docs
- **Multer** for file upload middleware
- **Passport.js** for session and auth handling

---

## 📌 Available Routes

| Resource       | Base Path    | Description                              |
| -------------- | ------------ | ---------------------------------------- |
| Auth           | `/auth`      | User registration and login              |
| Users          | `/users`     | User profile, avatars, status            |
| General Files  | `/files`     | Upload, list, and manage general files   |
| Incoming Mails | `/mails/in`  | CRUD operations for incoming mails       |
| Outgoing Mails | `/mails/out` | Manage and send outgoing correspondence  |
| MDAs           | `/mdas`      | Manage ministries, departments, agencies |

---

## 🔐 Authentication

Most routes are protected via JWT tokens. Ensure you send the token as a Bearer token in your request headers:

```
Authorization: Bearer <your_token>
```

---

## 📄 Swagger Documentation

All API endpoints are fully documented using **Swagger JSDoc**.

To access Swagger UI in your running application:

```
GET /api-docs
```

It includes:

- Full endpoint descriptions
- Request/response models
- Query parameters
- File upload specs
- Security schemas

---

## ⚙️ Installation

```bash
git clone https://github.com/tay4real/memfile-backend.git
cd memfile-backend
npm install
```

Create a `.env` file in the root directory:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/memfile
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

Then run the app:

```bash
npm run dev
```

---

## 📁 Folder Structure

```
📦src
 ┣ 📂routes
 ┣ 📂services
 ┃ ┣ 📜auth.routes.js
 ┃ ┣ 📜users.routes.js
 ┃ ┣ 📜files.routes.js
 ┃ ┣ 📜incomingMails.routes.js
 ┃ ┣ 📜outgoingMails.routes.js
 ┃ ┗ 📜mdas.routes.js
 ┣ 📂utils
 ┣ 📜server.js
 ┗ 📜swagger.js
```

---

## 🧪 Example Swagger Annotation

```js
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
```

---

## 🤝 Contributing

Feel free to submit issues or pull requests. To contribute:

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork
5. Submit a PR

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 💬 Feedback

For suggestions, bug reports, or support, feel free to open an issue or contact the maintainer directly.
