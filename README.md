# BAPS Swaminarayan Mandir, Tithal - Volunteer ID Card Management System
# (બી.એ.પી.એસ. સ્વામિનારાયણ મંદિર, તીથલ - સ્વયંસેવક આઈડી કાર્ડ સિસ્ટમ)

A complete, production-ready, full-stack Volunteer ID Card Management System designed for BAPS Swaminarayan Mandir, Tithal - Valsad.

---

## 🌟 Key Features

1. **Exact ID Card Specifications**:
   - Exact physical dimension: **74mm × 100mm** (Aspect ratio: 0.74).
   - High-resolution target **300 DPI** export (~874 × 1181 px).
   - Authentic decorative golden outer border, light cream textured background, and sacred BAPS Mandir backdrop.
   - Dual corner BAPS logos with top heading: `BAPS સ્વામિનારાયણ મંદિર, તીથલ - વલસાડ`.
   - Dynamic Royal Blue ribbon displaying the volunteer's assigned Seva Vibhag.
   - Gold-framed volunteer photograph (supports gallery upload, mobile camera & desktop webcam with zoom, crop, and compression).
   - Clean Gujarati details: નામ, મો. નં., ગામ, ક્ષેત્ર.
   - Sacred Mahant Swami Maharaj blessing text: `સેવા મોક્ષ માટે કરવી - મહંતસ્વામી મહારાજ`.
   - Bottom crimson ribbon: `સ્વયંસેવક દળ - Tithal`.
   - Secure QR code linking to public verification page.

2. **Public QR Verification Page**:
   - URL: `/verify/:volunteer_id`
   - Read-only verification displaying Volunteer ID, Name, Village, Kshetra, Seva Vibhag, and Verification Status.
   - **Privacy First**: Volunteer mobile number is strictly omitted from public verification.

3. **Admin Management Dashboard (સંપૂર્ણ ગુજરાતી)**:
   - Modern responsive UI with metrics: કુલ આઈડી કાર્ડ, કુલ સ્વયંસેવકો, કુલ સેવા વિભાગ, તાજેતરના કાર્ડ.
   - Volunteer search (by Name, ID, Mobile, Village, Kshetra) and filters.
   - Dynamic Seva Vibhag Management (Add, Edit, Activate/Deactivate, Delete).
   - Admin access control (Super Admin & Admin roles).

4. **Multi-Format Export & Print**:
   - High quality PDF Download (exact 74mm × 100mm, zero page margins).
   - 300 DPI PNG Download for digital ID usage.
   - Direct Print styling with color accuracy and background preservation.

5. **Security & Free Tier Infrastructure**:
   - Built on 100% Free-Tier services: Netlify Free (Hosting), Supabase Free (Database, Auth, Storage), GitHub Free (Version Control).
   - Supabase PostgreSQL with Row Level Security (RLS).
   - Secure Postgres RPC `verify_volunteer` with `SECURITY DEFINER` for restricted public verification.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Backend & Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (`volunteer-photos` bucket)
- **PDF Generation**: jsPDF + html2canvas
- **Image Processing**: react-easy-crop + browser-image-compression
- **QR Code**: qrcode.react

---

## 🛠️ Setup & Deployment Guide

### 1. Database Setup (Supabase)
Run the SQL migration in `supabase/migrations/20261031_initial_schema.sql` inside your Supabase Project's SQL Editor:
- Creates `seva_vibhag`, `volunteers`, and `admin_profiles` tables.
- Sets up Row Level Security (RLS) policies.
- Creates the `verify_volunteer` public RPC function.
- Creates the `volunteer-photos` storage bucket with access policies.
- Seeds initial Seva Vibhags.

### 2. Environment Variables
Create `.env` based on `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_APP_URL=https://your-domain.netlify.app
```

### 3. Local Development
```bash
npm install
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
Output directory: `dist`

### 5. Netlify Deployment
1. Connect your repository to Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`.
5. Deploy!
