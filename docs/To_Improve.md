
 - Accidently redirected to dashboard page with (default user@gmail.com profile), instead of login page upon copy and pasting (http://localhost:5173) on browser. Second try works as intended, redirected to login page. might be some bug. This happens when I first run both server and then copy and paste the link on the browser.
 - I'd love to see effective error message on login and register pages. such as user already exists. and also password requirement checks in registeration page. in login page, incorrect password or user with (email user entered ) does not exists, etc.
 - first name entry is better to be on the on-borading page rather than registeration page.
 - Gym opening time selections should be optional. User can be going to multiple gyms. Currently it is only applicable for people going to the same gym everyday. (Maybe, before asking user the gym hour, we better sure he's going to the same gym everyday, and briefly explain to him why are we asking this info and how it will be used in advanced features)
 - The button to enable dropdown time selection is not clearly visible. And make sure user knows instantly that he can either type or choose from the drop down. The drop down shouldn't be looping. for example, for minutes selection, the first option should be 00 and the last should be 59, scrolling further 59 shouldn't bring back 00 and loops. make the drop downs end somewhere.
- Start of the weekly frequency bar should be 1 day and end in 7 days.
- Upon finishing setup, tell user that 4 weeks workout has been created for him, and make him click on the workouts app to check.
- Clicking workouts from the sidebar brings me to workouts but doing so removes "Templates" from the menu bar. Clicking the " templates" hides the sidebar. idk if these are intentional or not.
- New user should start with empty data. Now I am seeing 4/5 workouts, 72 sets of workouts completed, 18,000kg of volume lifted. And also seeing data in weekly heatmap. also in volume progress map, 
- In muscle recovery section, I see why the head, palms and lower back areas are faded out, but think about it again, should we just leave it like that or give them "recovered" color.
- Once you have logged in, if user try to go back to login page by manipulating the url, should we allow?
-  why the workout display name and actual name different? e.g. if user click on workouts tab, he'll see "Push 💪" but when clicked on the workout card, the name is "PPL PUSH"
- "Start workout" will open that workout page but there should be a button "Start Now" to confirm user. Before clicking, the workout will just be in editing stage. After clicking, there should be a clock ruuning to note how much time has passed since the workout has started. Only after clicking "Start now" user should be able to log sets.
- If user want to exit the workout screen after starting the workout, ask user if he wants to just exist the screen or stop and discard the workout or finish the workout. if there's a workout going on,  instead of showin the next session card, show sth like workout in progress, name of the workout, next workout set, if on rest time, show remaining rest time, button to finish workout, go to workout screen. There should be a button to stop and discard wokout in the current workout page.
- In the current workout page, if u click on a text box to edit the number, all text in that text box should be preselected, means if user types anything, the existing text will be deleted. Once user finished a workout, if he do another workout within the certain period, the default numbers should be from the logged numbers from previous  workout. 
- I  am being able to edit the completed sets.
- Leave inputs empty and tap ✓ → ✅ it logs the previous/target values ("same as last time")
- 💡 **Previous** shows `—` the first time. Complete a set, finish the workout, then open another workout with the same exercise to see ghost text like `60 kg x 8`. This feature is not working. Wait I see why it is not working, when u open a workout, the default values 0kg 8 reps is covering ghost texts.
- Workout Note - Click outside the box → ✅ saved (a • appears next to "Notes" when collapsed) - not working
-  User should be able to choose between manual swap and smart swap. There should be buttons to delete exercises from the current workouts or add.
- The workout is not swapped.
- No User Profile Edit button. User name, height, weight, goal, experiences are not reflected in the card
- I think it would be better to have scheduled workouts in the workouts page and completed ones in the profile page. at least with a button to view the completed ones. and show some effective stats.
- in the template builder page, reps and sets text boxes are not aligned. 
- add animations while moving the exercises up and down in the workout.
- asking for user confirmations should be popup boxes. not window.alert.
- User should be able to add default weights in the template builder.
- node .\phase2test.js
node:internal/deps/undici/undici:13510
      Error.captureStackTrace(err);
            ^

TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async call (E:\Antigravity\Workout app\backend\phase2test.js:7:15)
    at async E:\Antigravity\Workout app\backend\phase2test.js:25:11 {
  [cause]: AggregateError [ECONNREFUSED]: 
      at internalConnectMultiple (node:net:1134:18)
      at afterConnectMultiple (node:net:1715:7) {
    code: 'ECONNREFUSED',
    [errors]: [
      Error: connect ECONNREFUSED ::1:3001
          at createConnectionError (node:net:1678:14)
          at afterConnectMultiple (node:net:1708:16) {
        errno: -4078,
        code: 'ECONNREFUSED',
        syscall: 'connect',
        address: '::1',
        port: 3001
      },
      Error: connect ECONNREFUSED 127.0.0.1:3001
          at createConnectionError (node:net:1678:14)
          at afterConnectMultiple (node:net:1708:16) {
        errno: -4078,
        code: 'ECONNREFUSED',
        syscall: 'connect',
        address: '127.0.0.1',
        port: 3001
      }
    ]
  }
}

Node.js v22.18.0
  