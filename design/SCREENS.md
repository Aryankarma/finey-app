# Screens

Every V4 board, where it should live in the app, how it is shown, and where it links.
Open `finey-prototype.html` to try any of them. Screenshots are in `screens/`, numbered in this order.

| # | Board | Screen | Route or component | Shown as | Links to |
|---|---|---|---|---|---|
| 1 | `V4-Home.dc.html` | Home | `app/(tabs)/index.tsx` | Tab | Month picker, Settings, New entry, Voice entry, Ledger, Entry details, Spending breakdown, People, Wealth |
| 2 | `V4-Locked.dc.html` | Home, amounts hidden | `Sheet over Home (PinUnlockSheet)` | Bottom sheet | None |
| 3 | `V4-Capture.dc.html` | New entry | `app/entry/new.tsx` | Full-screen modal | Home, Paste text, Description suggestions, Date picker |
| 4 | `V4-Voice.dc.html` | Voice entry | `app/entry/voice.tsx` | Full-screen modal | Home |
| 5 | `V4-Ledger.dc.html` | Ledger | `app/(tabs)/ledger/index.tsx` | Tab | Export, New entry, Ledger calendar, Month picker, Filter and sort, Entry details, Home, Spending breakdown, People, Wealth |
| 6 | `V4-Calendar.dc.html` | Ledger calendar | `app/(tabs)/ledger/calendar.tsx` | Top tab inside Ledger | Month picker, New entry, Ledger, Entry details, Home, Spending breakdown, People, Wealth |
| 7 | `V4-Spending.dc.html` | Spending breakdown | `app/(tabs)/spending/index.tsx` | Tab | Month picker, Spending trends, Food & Dining, Ledger, Home, People, Wealth |
| 8 | `V4-Trend.dc.html` | Spending trends | `app/(tabs)/spending/trends.tsx` | Top tab inside Spending | Month picker, Spending breakdown, Home, Ledger, People, Wealth |
| 9 | `V4-People.dc.html` | People | `app/(tabs)/people/index.tsx` | Tab | New debt or credit, Record a payment, Edit a record, Home, Spending breakdown, Ledger, Wealth |
| 10 | `V4-Settle.dc.html` | Record a payment | `Sheet over People (RecordPaymentSheet)` | Bottom sheet | People |
| 11 | `V4-Wealth.dc.html` | Wealth | `app/(tabs)/wealth/index.tsx` | Tab | New holding, Holding details, Home, Spending breakdown, Ledger, People |
| 12 | `V4-Entry.dc.html` | Entry details | `Sheet over Ledger (EntrySheet)` | Bottom sheet | Export, New entry, Ledger, Ledger calendar, Month picker, Filter and sort, Home, Spending breakdown, People, Wealth, Edit entry |
| 13 | `V4-EditEntry.dc.html` | Edit entry | `app/entry/[id]/edit.tsx` | Full-screen modal | Entry details, Date picker, Ledger |
| 14 | `V4-Suggest.dc.html` | Description suggestions | `app/entry/describe.tsx` | Pushed inside the New entry modal | New entry |
| 15 | `V4-Paste.dc.html` | Paste text | `app/entry/paste.tsx` | Full-screen modal | New entry, Voice entry, Ledger |
| 16 | `V4-Category.dc.html` | Food & Dining | `app/(tabs)/spending/[category].tsx` | Pushed in the Spending tab | Spending breakdown, Month picker, Entry details, Home, Ledger, People, Wealth |
| 17 | `V4-Month.dc.html` | Month picker | `MonthPickerSheet component` | Bottom sheet | Home, amounts hidden, Settings, New entry, Voice entry, Ledger, Entry details, Home, Spending breakdown, People, Wealth |
| 18 | `V4-Date.dc.html` | Date picker | `DatePickerSheet component` | Bottom sheet | Home, Paste text, Description suggestions, New entry |
| 19 | `V4-Filters.dc.html` | Filter and sort | `LedgerFiltersSheet component` | Bottom sheet | Export, New entry, Ledger, Ledger calendar, Month picker, Entry details, Home, Spending breakdown, People, Wealth |
| 20 | `V4-Export.dc.html` | Export | `ExportSheet component` | Bottom sheet | New entry, Ledger, Ledger calendar, Month picker, Filter and sort, Entry details, Home, Spending breakdown, People, Wealth |
| 21 | `V4-AddDebt.dc.html` | New debt or credit | `app/people/new.tsx` | Full-screen modal | People, Date picker |
| 22 | `V4-EditDebt.dc.html` | Edit a record | `app/people/[id]/edit.tsx` | Full-screen modal | People, Date picker |
| 23 | `V4-AddHolding.dc.html` | New holding | `app/wealth/new.tsx` | Full-screen modal | Wealth, Date picker |
| 24 | `V4-Holding.dc.html` | Holding details | `app/(tabs)/wealth/[id].tsx` | Pushed in the Wealth tab | Wealth, Home, Spending breakdown, Ledger, People |
| 25 | `V4-Settings.dc.html` | Settings | `app/settings/index.tsx` | Pushed from Home | Home, Change PIN, Export |
| 26 | `V4-ChangePin.dc.html` | Change PIN | `app/settings/pin.tsx` | Pushed from Settings | Settings |

## What each screen does

**1. Home** (`V4-Home`). Balance counts up on open; ring ticks draw in; eye button blurs every amount; quick-add field; recent rows open entry details.

**2. Home, amounts hidden** (`V4-Locked`). PIN 12345 shows amounts; a wrong PIN shakes the dots with an error; fingerprint key unlocks; "Hide amounts again" re-locks.

**3. New entry** (`V4-Capture`). Expense and Income tabs with a sliding underline; app keypad (no system keyboard); category chips; button stays disabled with a hint until amount and category are set; success sheet.

**4. Voice entry** (`V4-Voice`). Review: amounts and dates highlighted in the transcript, untick wrong rows. Record again: listening timer and waveform, then a processing bar, then back to review.

**5. Ledger** (`V4-Ledger`). Grouped by day; search; filter chips open Filter and sort; swipe left to delete with an undo toast and totals updating.

**6. Ledger calendar** (`V4-Calendar`). Days shaded by spend; green dot for money in; tap a day to show its total and entries below.

**7. Spending breakdown** (`V4-Spending`). Tap a week bar to change the caption; category share bar; rows open the category; show more expands the list.

**8. Spending trends** (`V4-Trend`). Savings rate; running balance chart, tap a day to inspect; suggested monthly budget with "Set this budget".

**9. People** (`V4-People`). Open, Settled and All tabs; tap a person to expand history and actions; Rahul has Record payment and Edit.

**10. Record a payment** (`V4-Settle`). Keypad amount; 50%, 75% and all quick picks; error if more than what is owed; progress ring fills on done.

**11. Wealth** (`V4-Wealth`). Tiles sized by value and shaded by return; tap a tile or chip to filter; refresh prices; Infosys row opens holding details.

**12. Entry details** (`V4-Entry`). Details list; Save for later switch with a bookmark pop; Delete closes the sheet and shows an undo toast; Edit opens Edit entry.

**13. Edit entry** (`V4-EditEntry`). Same layout as New entry, prefilled; shows "Was ₹486" when the amount changes; Save stays disabled until something changes.

**14. Description suggestions** (`V4-Suggest`). Filters your history as you type and bolds the match; picking one also sets its category; offers "Add" for new text.

**15. Paste text** (`V4-Paste`). Write, reading (skeleton rows), review (parsed rows, possible repeats unticked, missing amounts flagged), saved.

**16. Food & Dining** (`V4-Category`). Total counts up; share bar grows; tap a day bar to read it and highlight its entries; show all 15 entries.

**17. Month picker** (`V4-Month`). Year stepper with slide; month grid; current month outlined; future months disabled; picking closes the sheet and updates the title.

**18. Date picker** (`V4-Date`). Today and Yesterday chips; month navigation; days after today disabled; button label reads the picked day.

**19. Filter and sort** (`V4-Filters`). Show segmented control, saved-only switch, sort radios; live count on the button; Reset; applying filters the list behind it.

**20. Export** (`V4-Export`). Everything or only what is filtered; progress bar; ready state with Save to Downloads and Share file.

**21. New debt or credit** (`V4-AddDebt`). They owe me or I owe them; amount; recent people chips; kind chips; note and date; button label reads the record; success sheet.

**22. Edit a record** (`V4-EditDebt`). Summary ring updates live; total cannot go below what was paid back; delete asks for confirmation in a dialog.

**23. New holding** (`V4-AddHolding`). Type chips; ticker lookup (TCS, INFY, HDFCBANK, BTC, ETH are known); not-found path asks for the value; gain preview.

**24. Holding details** (`V4-Holding`). Value counts up; refresh price; put-in vs now bars; edit in place with a live preview; remove asks for confirmation.

**25. Settings** (`V4-Settings`). Privacy and fingerprint switches; theme (Light previews on this screen only); accent colour swatches; export; version.

**26. Change PIN** (`V4-ChangePin`). Current PIN (12345), new PIN (4 to 6 digits, rejects easy or same PINs), confirm (mismatch error); 30 second wait after 3 wrong tries.


## Notes

- Sheets and pickers are listed as components because several screens open them. In the boards each one is drawn over the screen it usually opens from.
- The tab bar shows on the five tabs and on pushed screens inside them (Food & Dining, Holding details). Modals and Settings hide it.
- Records shown with a single example (Rahul, Infosys, Swiggy dinner) stand in for any record of that kind.
