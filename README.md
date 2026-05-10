# The Curated Cart

A self-sufficient Amazon affiliate blog website for Home Decor, Fashion, Skincare, and more.

## Features
- **Viral Product Tracker**: Manage products and track their content status.
- **AI Content Assistant**: Generate blog outlines, social media hooks, and newsletter blurbs with one click.
- **Money Page Builder**: Create high-converting roundup posts.
- **Automated Dashboard**: Weekly checklists and content calendar.
- **Mobile Responsive**: Luxury design that looks great on any device.

## Local Setup

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="your-api-key"
   NEXT_PUBLIC_AMAZON_TAG="your-tag-20"
   ```

3. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

## Deployment to Vercel

1. **Push to GitHub**:
   Push your code to a GitHub repository.

2. **Connect to Vercel**:
   - Create a new project on Vercel.
   - Import your repository.
   - Add the following Environment Variables in the Vercel dashboard:
     - `DATABASE_URL`: (Use a hosted Postgres URL like Supabase for production)
     - `OPENAI_API_KEY`: Your OpenAI API key.
     - `NEXT_PUBLIC_AMAZON_TAG`: Your Amazon Associates tag.

3. **Deploy**:
   Vercel will automatically build and deploy your site.

## Amazon Associates Integration
- Ensure your `NEXT_PUBLIC_AMAZON_TAG` is correct.
- The site automatically appends this tag to Amazon links (if implemented in logic) or you should use it in your affiliate links.
- Mandatory disclaimers are already included in the footer and on blog posts.

## Production Database Note
For Vercel deployment, it is recommended to use a hosted PostgreSQL database (e.g., Supabase, Neon, or Vercel Postgres). Update the `DATABASE_URL` and `datasource` provider in `prisma/schema.prisma` if switching from SQLite.

Commit changes
