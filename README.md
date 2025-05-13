<<<<<<< HEAD
# Setuu
=======
# Setu - Company Documents

A modern React application for managing company documents, built with Next.js, Tailwind CSS, and ShadcN UI components.

## Features

- Clean and modern UI design
- Form validation
- File upload functionality
- Responsive layout
- Smooth animations with Framer Motion
- Dark mode support

## Prerequisites

- Node.js 18.x or later
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd setu
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the frontend server:
```bash
npm run dev
# or
yarn dev
```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [ShadcN UI](https://ui.shadcn.com/) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Radix UI](https://www.radix-ui.com/) - Accessible components

5. Run the backend agent server on the root directory
 ```bash
 cd backend
 uvicorn main:app --reload
 ```

## Project Structure

```
agent.py
main.py
.env
src/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── globals.css
  ├── components/
  │   ├── CompanyDocuments.tsx
  │   └── ui/
  │       ├── button.tsx
  │       ├── checkbox.tsx
  │       ├── input.tsx
  │       ├── label.tsx
  │       └── select.tsx
  └── lib/
      └── utils.ts
```

## Contributing

Feel free to submit issues and enhancement requests. 
>>>>>>> fc35c76 (Setu demo)
