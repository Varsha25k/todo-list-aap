# TaskFlow – To-Do List Application

TaskFlow is a modern and responsive To-Do List web application designed to help users efficiently manage their daily tasks. The application supports full CRUD operations, allowing users to create, update, and delete tasks easily while tracking their progress.

---

## Features

- Full CRUD operations (Create, Read, Update, Delete)
- Modern responsive user interface
- Dark / Light mode support
- Real-time task progress tracking
- Smart search and filtering (All, Pending, Completed, Overdue)
- Task priority levels (High, Medium, Low)
- Task categories for better organization
- Due dates with overdue alerts
- Bulk clear completed tasks
- Mobile-friendly design with smooth UI interactions

---

## Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js

**Storage**
- In-memory data storage (data persists during the session)

---

## Installation and Setup

Clone the repository:

```bash
git clone https://github.com/Varsha25k/todo-list-app.git
cd todo-list-app
```

Install dependencies:

```bash
npm install
```

Run the application in development mode:

```bash
npm run dev
```

Run the application in production mode:

```bash
npm start
```

The application will start on:

```
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|------|------|------|
| GET | /api/tasks | Retrieve all tasks |
| POST | /api/tasks | Create a new task |
| PUT | /api/tasks/:id | Update an existing task |
| DELETE | /api/tasks/:id | Delete a task |
| DELETE | /api/tasks/clear/completed | Remove all completed tasks |

---

## Project Purpose

This project was created as part of an internship task to demonstrate practical understanding of:

- Full stack web development
- REST API creation
- Frontend and backend integration
- Task management logic

---


LinkedIn  
https://www.linkedin.com/in/varsha-keswani

GitHub  
https://github.com/Varsha25k
