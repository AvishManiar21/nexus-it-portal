# Testing Checklist for Nexus-IT Solutions Portal

This document provides step-by-step testing instructions for all implemented features.

## Prerequisites
- Frontend running: `npm run dev` on http://localhost:3000
- Backend running: `python -m uvicorn main:app --reload --port 8000`
- Admin login credentials: `admin@nexusit.com` / `admin123`

---

## Public-Facing Features (No Login Required)

### US-1: Browse Nexus-IT Product Catalog
**What to test:**
1. Go to http://localhost:3000
2. Homepage shows **3 service cards**:
   - Cloud Services (Cloud Infrastructure Suite)
   - Cybersecurity (Cybersecurity Shield)
   - AI Analytics (AI Analytics Dashboard)
3. Click "Explore Services" button or go to http://localhost:3000/products
4. Verify you see the product catalog with **3 products** from the database
5. Each product card should show:
   - Product name
   - Category
   - Price
   - Image placeholder
6. Products should be displayed in a grid layout

**Expected:** Both homepage and /products page show the same 3 products

---

### US-2: View Full Product Detail Page
**What to test:**
1. From the homepage, click on any product card
2. Verify you're taken to `/products/[id]` page
3. Product detail page should show:
   - Product name
   - Full description
   - Category
   - Price
   - Demo video section (if available)
4. Click "Back to Products" link to return to catalog

**Expected:** Product details display correctly with all information

---

### US-3: Embedded Demo Video Player
**What to test:**
1. Go to any product detail page (e.g., http://localhost:3000/products/1)
2. Scroll down to the "Product Demo" section
3. Verify embedded YouTube video player is visible
4. Try playing/pausing the video
5. Video interactions should be tracked

**Expected:** Video player loads and plays correctly

---

### US-4: Request for Demo (RFD) Form
**What to test:**
1. On any product page, find the "Request a Demo" button
2. Click the button to open the RFD form
3. Fill in the form:
   - Company name (required)
   - Contact person (required)
   - Email (required, must be valid format)
   - Phone (required)
   - Budget range (select from dropdown)
   - Select interested products (checkboxes)
   - Optional message
4. Submit the form
5. Verify success message appears

**Expected:** Form validates inputs and submits successfully

**To verify submission:**
- Log in as admin and go to `/admin/leads`
- You should see a new lead created from the RFD submission

---

### US-5: Contact Us Form
**What to test:**
1. Go to http://localhost:3000/contact (or find Contact Us link)
2. Fill in the contact form:
   - Name (required)
   - Email (required, valid format)
   - Subject (required)
   - Message (required)
3. Submit the form
4. Verify success message appears

**Expected:** Form submits successfully

**To verify:**
- Check admin dashboard for the contact message
- Message should be linked to a lead profile

---

### US-8: Browsing Session Recognized Across Pages
**What to test:**
1. Open browser DevTools > Application > Cookies
2. Visit http://localhost:3000
3. Check for `visitor_session_id` cookie
4. Note the cookie value
5. Navigate to different pages (products, contact, etc.)
6. Verify the same `visitor_session_id` persists across all pages

**Expected:** Same session ID maintained throughout the visit

---

### US-9: Capture Demo Video Interactions
**Status:** ⚠️ BLOCKED - Supabase API Bug (see KNOWN_ISSUES.md)

**What to test:**
1. Go to any product page with a demo video
2. Play the video for a few seconds
3. Pause the video
4. The interaction should be logged in the background

**Expected:** Video events tracked (verify in database: `video_engagement_events` table)

**Known Issue:** The Supabase PostgREST API is not persisting data despite returning success responses. Frontend and backend code are working correctly. This is a Supabase infrastructure bug that requires support intervention.

---

## Admin Dashboard Features (Login Required)

### US-14: Log In Securely to Administrator Dashboard
**What to test:**
1. Go to http://localhost:3000/admin/login
2. Try logging in with wrong credentials
   - Expected: Error message "Invalid credentials"
3. Log in with correct credentials:
   - Email: `admin@nexusit.com`
   - Password: `admin123`
4. Verify you're redirected to `/admin` dashboard

**Expected:** Successful login redirects to admin dashboard

---

### US-15: Automatic Sign Out After Inactivity
**What to test:**
1. Log in to admin dashboard
2. Wait 15 minutes without any activity
3. Try to navigate to any admin page or refresh

**Expected:** Automatically redirected to login page with "expired=1" parameter

**Quick test (don't wait 15 min):**
- Clear the `session` cookie from DevTools > Application > Cookies
- Try accessing `/admin`
- Should redirect to login

---

### US-13: Secure Lead Data Access
**What to test:**
1. **Without login:**
   - Try accessing http://localhost:3000/admin/leads directly
   - Expected: Redirected to login page

2. **With login:**
   - Log in as admin
   - Go to `/admin/leads`
   - Verify you can see the lead list
   - All API calls should include authentication

**Expected:** Lead data only accessible when authenticated

---

### US-16: Search and Sort Leads Dashboard
**What to test:**
1. Log in and go to `/admin/leads`
2. **Test Search:**
   - Type a company name in the search box
   - Leads should filter in real-time (200ms debounce)
   - Try searching by name, email, or company
3. **Test Sorting:**
   - Click column headers: Company Name, Contact Person, Email, Lead Status, Creation Date
   - Verify sort order changes (▲ ascending, ▼ descending)
   - Click same column again to reverse sort direction

**Expected:** Search filters and sorting work correctly

---

### US-17: View Full Lead Profile
**What to test:**
1. From `/admin/leads`, click on any lead row
2. Verify you're taken to `/admin/leads/[id]` profile page
3. Profile should display:
   - **Lead Information:** Name, email, company, phone, budget, source, status
   - **RFD Submissions:** List of demo requests with products
   - **Contact Messages:** Messages from contact form
   - **Internal Notes:** Notes added by admins
   - **Timeline:** Chronological activity history
   - **Status History:** Log of status changes (if any)

**Expected:** Complete lead profile with all related data

---

### US-18: Write Internal Notes on Lead Profile
**What to test:**
1. Go to any lead profile page (`/admin/leads/[id]`)
2. Scroll to "Internal Notes" section
3. Type a note in the text area
4. Click "Add Note" button
5. Verify note appears in the list immediately
6. Refresh the page
7. Verify note persists

**Expected:** Notes are saved and displayed with timestamp and author

---

### US-19: Update Lead Sales Pipeline Status
**What to test:**
1. Go to any lead profile page
2. Find the status dropdown at the top (currently shows: New/Contacted/Converted)
3. **Change status:**
   - Select a different status from dropdown
   - Verify "Updating..." message appears briefly
   - Status should update immediately
4. Scroll to "Status Change History" section
5. Verify the status change is logged with:
   - Old status → New status
   - Your admin name
   - Timestamp
6. Refresh the page
7. Verify status change persists

**Expected:** Status updates and history is logged

---

### US-20: Filter Lead List by Pipeline Status
**What to test:**
1. Go to `/admin/leads`
2. Find the "Filter by status" dropdown next to the search box
3. **Test each filter:**
   - Select "New" - should show only new leads
   - Select "Contacted" - should show only contacted leads
   - Select "Converted" - should show only converted leads
   - Select "All Statuses" - should show all leads
4. **Test combined filters:**
   - Apply a status filter
   - Type in the search box
   - Both filters should work together
5. Verify lead count updates at the bottom

**Expected:** Status filter works independently and with search

---

## Additional Tests

### Form Validation (PR #101)
**What to test:**
1. **RFD Form:**
   - Try submitting without required fields
   - Try invalid email format
   - Verify error messages appear

2. **Contact Form:**
   - Try submitting with empty fields
   - Try invalid email
   - Verify validation messages

**Expected:** All forms validate input before submission

---

### Integration Tests

**Test 1: Complete Visitor Journey**
1. Visit homepage as visitor
2. Browse products
3. Watch a demo video
4. Submit RFD form
5. Submit contact form
6. Log in as admin
7. Verify new lead was created
8. Verify RFD submission is linked to lead
9. Verify contact message is linked to lead
10. Add a note to the lead
11. Change lead status to "Contacted"
12. Verify all changes are reflected

**Test 2: Session Management**
1. Log in as admin
2. Open admin dashboard in multiple tabs
3. Log out from one tab
4. Try accessing admin pages in other tabs
5. Should be logged out everywhere

---

## Known Issues & Limitations

### Schema Cache Issue
- The `lead_status_audit` and `anonymous_engagement_logs` tables may show as missing initially
- **Workaround:** Application handles this gracefully - features work but status history may not display until Supabase schema cache refreshes
- **To fix permanently:** Go to Supabase Dashboard → Settings → API → Reload Schema

### Demo Videos
- All products currently use placeholder YouTube video
- Video URLs can be updated in the database

---

## Quick Smoke Test (5 minutes)

If you want to quickly verify everything works:

1. ✅ Visit homepage - see 3 services, click "Explore Services" to see the same 3 products
2. ✅ Click a product - see product detail page
3. ✅ Submit RFD form - see success message
4. ✅ Go to /admin/login - log in successfully
5. ✅ View /admin/leads - see lead list with search and filter
6. ✅ Click a lead - see full profile
7. ✅ Add a note - verify it saves
8. ✅ Change status - verify it updates
9. ✅ Filter by status - verify filtering works
10. ✅ Search for a lead - verify search works

If all 10 steps pass, the application is working correctly!

---

## Testing Checklist Summary

| Feature | URL | Status |
|---------|-----|--------|
| Product Catalog | http://localhost:3000 | ⬜ |
| Product Detail | http://localhost:3000/products/1 | ⬜ |
| Demo Video | http://localhost:3000/products/1 | ⬜ |
| RFD Form | http://localhost:3000/products/1 | ⬜ |
| Contact Form | http://localhost:3000/contact | ⬜ |
| Admin Login | http://localhost:3000/admin/login | ⬜ |
| Leads Dashboard | http://localhost:3000/admin/leads | ⬜ |
| Lead Profile | http://localhost:3000/admin/leads/2 | ⬜ |
| Lead Notes | http://localhost:3000/admin/leads/2 | ⬜ |
| Status Update | http://localhost:3000/admin/leads/2 | ⬜ |
| Status Filter | http://localhost:3000/admin/leads | ⬜ |
| Search Leads | http://localhost:3000/admin/leads | ⬜ |

**Mark ✅ when tested and working!**
