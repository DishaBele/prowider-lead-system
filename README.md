# Prowider Lead Distribution System

A full-stack lead distribution platform built using Next.js 14, PostgreSQL, Prisma ORM, and Server-Sent Events (SSE).

## Live Demo

https://YOUR-RENDER-URL.onrender.com

## GitHub Repository

https://github.com/DishaBele/prowider-lead-system

---

# Features

## 1. Customer Lead Form
Customers can submit lead information through a responsive form interface.

## 2. Automated Lead Distribution
Incoming leads are automatically assigned to providers using a balanced allocation strategy.

## 3. Provider Dashboard
Providers can view assigned leads in a clean dashboard interface.

## 4. Real-Time Updates
Implemented using Server-Sent Events (SSE) for live lead updates without refreshing the page.

## 5. Webhook Simulation
Webhook endpoint simulation with idempotency handling to prevent duplicate processing.

---

# Tech Stack

- Next.js 14
- React
- PostgreSQL
- Prisma ORM
- TypeScript
- Tailwind CSS
- Server-Sent Events (SSE)
- Render Deployment

---

# Project Structure

```bash
prowider/
├── app/
├── prisma/
├── public/
├── components/
├── lib/
├── package.json
└── README.md
