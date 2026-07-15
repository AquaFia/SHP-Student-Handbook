
Hello friends, Aqua is here to explain her precious folder brainchild to you in English.

For the full viewer experience:
- Click on "index.html"
- That's it. Don't touch anything else. Just stay in your browser and play around lol.

Opening/Developing individual apps:
- Click on the "apps" folder
- Mess around with any html file in there, animation free
- If you're replacing old files, make sure they have the same name as the original





Ignore anything below this divider line. This is just for Aqua's memory.
---------------------------------------------
Open index.html for the handbook experience.
Open apps/map.html for the standalone map.

The project uses:
- The original handbook artwork embedded in v8
- The v8 filled display background
- The v8 startup, opening, closing, and room-return animations
- A separate apps/map.html file containing Jacey's room

To replace the map later:
1. Replace apps/map.html
2. Keep the filename exactly as map.html

MODULAR HANDBOOK UPDATE
- index.html opens apps/handbook.html after the existing index animation.
- apps/handbook.html is now a non-animated application shell.
- Student Profiles, Messages, Notes, Grades & Attendance, Assignments,
  ERiSU.EXE, and School Regulations are separate HTML files.
- apps/map.html was not modified.

JACEY ROOM BRIDGE FIX
- handbook.html now forwards Jacey room requests from map.html to index.html.
- It also forwards room-show and map-return commands from index.html back to map.html.
- The handbook home button is hidden while Jacey's room is open.
- map.html was not modified.

MERGED INDEX/HANDBOOK UPDATE
- The opening animation and handbook shell now live together in index.html.
- The handbook's visual CSS and markup were preserved.
- Apps continue to open as separate files in the single app iframe.
- The map now communicates directly with index.html for Jacey room transitions.
- The obsolete apps/handbook.html duplicate was removed.
- apps/map.html was not modified.

APP-LEVEL BACK BUTTON UPDATE
- Seven non-map apps now have a 'Student Handbook' button inside their own header.
- The old floating shell button is hidden for those seven apps.
- School Map still uses the existing shell-level button because map.html was not modified.
- index.html listens for shp:return-handbook from the app files.

MAP BACK BUTTON UPDATE
- School Map now has its own 'Student Handbook' button in the map header.
- The button appears only when map.html is opened in handbook mode.
- The map header is hidden in room-mode, so the button is not visible inside Jacey's room.
- The old shell-level floating button is now hidden for all eight apps.

CONSISTENT BACK BUTTON BEHAVIOR
- All eight apps now show their own in-header Student Handbook button whenever the app view is open.
- The School Map button no longer depends on a URL parameter.
- Room views continue to hide the map header, so the button is not visible inside rooms.
- The old shell-level floating button remains hidden.
