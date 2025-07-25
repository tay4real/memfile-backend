# Memfile Backend API

This API provides endpoints for managing memfiles, user authentication, and related operations. It is built with RESTful principles and uses JSON for data exchange.

## Main Features

- **User Authentication:** Register, login, and manage user sessions.
- **General Files:** OPerations related to general files.
- **File Uploads:** Upload and retrieve files associated with memfiles.
- **Search & Filtering:** Query memfiles using various filters.
- **Error Handling:** Standardized error responses for invalid requests.

## Usage

All endpoints are prefixed with `/api`. Authentication is required for most operations and is handled via JWT tokens.

Refer to the Swagger documentation in the `http://localhost:4000/api-docs/` for detailed endpoint specifications, request/response formats, and example payloads.