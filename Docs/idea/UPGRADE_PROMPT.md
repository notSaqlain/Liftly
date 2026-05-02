# Liftly B2B Upgrade — Full Developer Prompt

## Context

Liftly is a React (Vite + Tailwind + Capacitor/Android) fitness tracker app backed by Firebase/Firestore.
The app is transitioning from a B2C freemium model to a **B2B gym-partnership ecosystem**.
Gyms license Liftly; their members get premium features tied to their gym.

**Already done in this session:**
- `tailwind.config.js` — new dark color palette (`app-bg:#070B14`, `brand:#00E5D1`, `accent-purple:#7C6EF5`)
- `src/index.css` — full dark glassmorphism design system
- `src/components/Layout/MainLayout.jsx` — dark bottom nav with neon teal active indicators
- `src/components/Layout/SideDrawer.jsx` — dark drawer with My Gym / Community / Tools / Account sections

**Still needs to be done:** everything below.

---

## Design System Rules

- **Background:** `#070B14` (ultra-dark navy)
- **Card surface:** `#0D1526` with `border: 1px solid rgba(255,255,255,0.06)`
- **Elevated card:** `#111E38`
- **Brand color:** `#00E5D1` (vibrant teal) — used for CTAs, active states, highlights
- **Accent:** `#7C6EF5` (purple) — secondary highlights
- **Text:** `#F1F5F9` primary, `rgba(255,255,255,0.4)` muted
- **Font:** Plus Jakarta Sans (already imported)
- **All pages are dark** — no white backgrounds anywhere
- **Cards** use `background:#0D1526`, rounded-3xl, subtle border
- **Gradients on CTAs:** `linear-gradient(135deg, #00E5D1 0%, #3B82F6 100%)`
- **Header sections** use a dark hero with decorative blur orbs (teal/purple)

---

## Existing Data Model (Firestore)

```
users/{uid}
  firstName, lastName, email, photoURL, googlePhotoURL
  currentStreak, longestStreak, totalVolumeLifted, totalWorkoutsCompleted
  best1RM: { bench_press, deadlift, squat } (flat fields: best1RM_bench_press etc.)
  gymId, gymName        ← already stored
  trainingDays, sessionDuration, experienceLevel, fitnessGoal, trainingStyle
  weight, height, bodyFat, age, gender
  hideOnlineStatus, onboardingComplete, createdAt

users/{uid}/user_workouts/{workoutId}
  day, totalSets, totalVolume, completedAt (Timestamp)

gym_status/{docId}       ← crowd reports (add gymId filter)
  status: LOW|MEDIUM|HIGH, reportedBy, timestamp, gymId

gym_chat/{msgId}         ← global chat
gym_chats/{gymId}/messages/{msgId}  ← gym chat
gym_presence/{uid}       ← online status
```

---

## New Firestore Collections to Create

```
gyms/{gymId}/equipment/{equipmentId}
  name, category (Cables|Free Weights|Cardio|Machines|Other)
  status: available|broken|maintenance
  reportedBy (uid), reportedAt (Timestamp), lastUpdated

gyms/{gymId}/trainers/{trainerId}
  name, photoURL, specializations (array), bio, contactEmail

gym_challenges/{gymId}/challenges/{challengeId}
  title, description, metric, endsAt (Timestamp)
  createdAt, createdBy

gym_challenges/{gymId}/challenges/{challengeId}/entries/{uid}
  value (number), updatedAt (Timestamp), displayName, photoURL

gym_support/{gymId}/messages/{msgId}
  text, uid, displayName, photoURL, createdAt (Timestamp)

licenses/{code}           ← test license system
  code: "123456789"
  planName: "Liftly PRO - Annual"
  gymName: "Fitness Plus"
  expiresAt: Timestamp (2027-01-01)
  features: ["Real-time crowd", "PT Hub", "Equipment Status", "Gym Support", "Challenges"]
  pricePerYear: 550

users/{uid}/dms/{conversationId}
  participantUids: [uid1, uid2]
  participantNames: {uid1: "Name", uid2: "Name"}
  participantPhotos: {uid1: url, uid2: url}
  lastMessage, lastMessageAt, unreadCount

dm_conversations/{conversationId}/messages/{msgId}
  text, uid, displayName, photoURL, createdAt (Timestamp)
```

---

## Files to Create / Modify

### MODIFY `src/pages/Dashboard.jsx`

Full dark redesign. Keep all existing logic (crowd status, calendar, recent workouts, split picker, quick tools).

**Add:**
- Dark hero header with teal/purple orbs
- Gym Hub card (only if `userData.gymId` set): shows gym name, live crowd status (filtered by `gymId`), quick links to `/gym/equipment`, `/gym/trainers`, `/gym/challenges`, `/gym/support`
- If no gym: show "Link your gym →" prompt card
- All cards use `background:#0D1526`, rounded-3xl
- Crowd status Firestore query: add `where('gymId', '==', userData.gymId)` when gymId exists
- gym_status reports should save `gymId` field

### MODIFY `src/pages/Leaderboard.jsx`

- Dark redesign
- Add "My Gym" tab alongside existing global categories
- My Gym tab: query `users` collection filtered by `where('gymId', '==', currentUserGymId)` for streak/volume
- Show gym name in header when My Gym is active

### MODIFY `src/pages/Profile.jsx`

- Dark redesign
- Add "My Plan" nav card linking to `/my-plan`

### MODIFY `src/pages/LiftChat.jsx`

- Dark redesign (already mostly dark, just polish)

### MODIFY `src/pages/Workout.jsx`, `Stats.jsx`, `ActiveWorkout.jsx`, `AccountSettings.jsx`, `PersonalInfo.jsx`

- Dark redesign: replace white cards with `#0D1526` cards, replace `bg-slate-50` with dark equivalents, replace `text-slate-800` with `text-white`

### MODIFY `src/pages/auth/Login.jsx`, `Register.jsx`, `auth/Onboarding.jsx`

- Dark redesign to match new aesthetic

---

### NEW `src/pages/GymEquipment.jsx`

Route: `/gym/equipment`

**UI:**
- Dark header with back button, "Equipment Status" title
- Category filter tabs: All / Cables / Free Weights / Cardio / Machines / Other
- Equipment cards showing: name, category badge, status badge (🟢 Available / 🔴 Broken / 🟡 Maintenance)
- Tap card → bottom sheet to report status change
- If no gymId: show "Set your gym first" empty state

**Firestore:**
- Read: `gyms/{gymId}/equipment` (real-time onSnapshot)
- Write: `updateDoc` to change status + `reportedBy`, `reportedAt`

---

### NEW `src/pages/TrainerHub.jsx`

Route: `/gym/trainers`

**UI:**
- Dark header with back button, "Personal Trainers" title
- Grid (2 cols) of PT cards: photo (rounded-2xl), name, specialization chips
- Tap card → full-screen detail modal: photo, bio, specializations, "Send Message" button
- "Send Message" → navigate to `/messages/new?uid={trainerUid}&name={name}` (opens DM with that PT)
- If no gymId: "Set your gym first" empty state
- If no trainers: "No trainers registered yet" empty state

**Firestore:**
- Read: `gyms/{gymId}/trainers` (getDocs)

---

### NEW `src/pages/GymChallenges.jsx`

Route: `/gym/challenges`

**UI:**
- Dark header with back button, "Challenges" title
- Active challenges list: title, description, metric, countdown timer to `endsAt`
- Each challenge card expands to show mini-leaderboard (top 5 from `entries` subcollection)
- "Log My Progress" button → input modal to submit/update user's entry value
- Empty state: "No active challenges yet — your gym admin will create them soon"

**Firestore:**
- Read challenges: `gym_challenges/{gymId}/challenges` where `endsAt > now()`
- Read entries: `gym_challenges/{gymId}/challenges/{id}/entries` orderBy value desc limit 5
- Write entry: `setDoc` on `entries/{currentUser.uid}`

---

### NEW `src/pages/GymSupport.jsx`

Route: `/gym/support`

**UI:**
- Exactly like LiftChat but simpler — no global/gym toggle
- Dark header: "Gym Support" with gym name subtitle
- Messages from gym show with special "Gym Staff" badge
- Input field at bottom to send support requests
- If no gymId: "Set your gym first" empty state

**Firestore:**
- Collection: `gym_support/{gymId}/messages`
- Real-time onSnapshot, orderBy createdAt asc, limit 100

---

### NEW `src/pages/MyPlan.jsx`

Route: `/my-plan`

**UI:**
- Dark header "My Plan" with back button
- **License input section:** text input for license code + "Activate" button
  - On activate: read `licenses/{code}` from Firestore
  - If found: save `licenseCode`, `planName`, `expiresAt`, `gymName`, `features` to `users/{uid}`
  - Show success toast
- **Active Plan card** (if license activated): premium membership card design
  - Gradient border (teal → purple)
  - Shows: plan name, gym name, expiry date, days remaining
  - Feature list with checkmarks
  - Status badge: ACTIVE (green) or EXPIRED (red)
- **No plan state:** clean empty state with "Enter your license code" prompt

**Test license:** code `123456789` must exist in Firestore `licenses` collection with:
```json
{
  "code": "123456789",
  "planName": "Liftly PRO — Annual",
  "gymName": "Fitness Plus",
  "expiresAt": "2027-01-01T00:00:00Z",
  "pricePerYear": 550,
  "features": [
    "App Liftly PRO — no ads",
    "Real-time gym occupancy",
    "Priority PT contact",
    "Digital membership management",
    "Gym challenges & leaderboard"
  ]
}
```

---

### NEW `src/pages/DirectMessages.jsx`

Route: `/messages`

**UI:**
- Dark header "Messages" + compose button (pencil icon) → navigate to `/messages/search`
- List of existing conversations:
  - Avatar, other person's name, last message preview, timestamp
  - Unread count badge
  - Tap → `/messages/{conversationId}`
- Empty state: "No conversations yet — search for a user to start chatting"

**Firestore:**
- Query: `users/{uid}/dms` orderBy lastMessageAt desc
- Real-time onSnapshot

---

### NEW `src/pages/UserSearch.jsx`

Route: `/messages/search`

**UI:**
- Dark header "New Message" with back button
- Search input (debounced 300ms)
- Query `users` collection where `firstName >= searchTerm` (or use `displayName` prefix search)
- Results list: avatar, name, "Message →" button
- Tap → create/find conversation, navigate to `/messages/{conversationId}`

**Logic:**
- `conversationId = [uid1, uid2].sort().join('_')`
- Check if `users/{myUid}/dms/{conversationId}` exists; if not, create both sides

---

### NEW `src/pages/DMConversation.jsx`

Route: `/messages/:conversationId`

**UI:**
- Exactly like LiftChat UI (WhatsApp-style bubble layout)
- Dark header: other person's avatar + name + online indicator (from `gym_presence`)
- Back button → `/messages`
- Messages area: my messages (right, teal), their messages (left, dark card)
- Input bar at bottom
- Auto-scroll to bottom on new message

**Firestore:**
- Read: `dm_conversations/{conversationId}/messages` orderBy createdAt asc limit 100, onSnapshot
- Write message: addDoc to messages, updateDoc both `users/{uid}/dms/{conversationId}` with lastMessage/lastMessageAt
- Mark read: set unreadCount to 0 when opening conversation

---

### MODIFY `src/App.jsx`

Add these routes inside the protected MainLayout route:
```jsx
<Route path="/gym/equipment"         element={<GymEquipment />} />
<Route path="/gym/trainers"          element={<TrainerHub />} />
<Route path="/gym/challenges"        element={<GymChallenges />} />
<Route path="/gym/support"           element={<GymSupport />} />
<Route path="/my-plan"               element={<MyPlan />} />
<Route path="/messages"              element={<DirectMessages />} />
<Route path="/messages/search"       element={<UserSearch />} />
<Route path="/messages/:conversationId" element={<DMConversation />} />
```

---

## Bottom Nav (already done)

5 tabs: Home / Workout / Chat / Stats / Profile
Chat tab navigates to `/chat` (LiftChat). The DM system is accessed via SideDrawer → "Direct Messages".

---

## Key Rules

1. **No white backgrounds** anywhere in the app
2. **All new pages** follow the same header pattern: dark navy header with blur orbs, back button, title
3. **Empty states** always have an icon + title + description + optional CTA button
4. **Loading states** use the `.shimmer` class on placeholder divs
5. **Toasts** appear at top center, slide down, auto-dismiss after 3s
6. **Modals/bottom sheets** use `fixed inset-0 z-50 flex items-end` pattern with dark backdrop
7. **All gym-scoped features** show a "Set your gym first" empty state when `userData.gymId` is null
8. **The test license code is `123456789`** — seed this in Firestore manually or via a script
