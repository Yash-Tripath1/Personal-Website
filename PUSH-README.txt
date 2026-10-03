ANADI'S PORTFOLIO - finished source (commit 269764a on top of your GitHub main)

WHAT'S INSIDE: everything - astronaut at contact, glassy starfield preloader,
inertia scrolling on laptop, up/down arrows on phones, perf pass, .gitignore.

HOW TO PUSH TO GitHub (Yash-Tripath1/Personal-Website):

PATH 1 - cleanest (your VS Code folder is messed up, start fresh):
  1. rename the messy folder to Personal-Website-backup (safety)
  2. git clone https://github.com/Yash-Tripath1/Personal-Website.git
  3. copy the contents of this zip (except this readme) into the clone, overwrite
  4. cd Personal-Website && npm install && npm run dev   (check it runs)
  5. git add -A && git commit -m "polish: smooth scroll, mobile arrows, perf, gitignore"
  6. git push origin main        <- a normal push, no force needed

PATH 2 - if GitHub already has commit 269764a (i pushed it for you):
  1. rename the messy folder to Personal-Website-backup
  2. git clone https://github.com/Yash-Tripath1/Personal-Website.git
  3. done - the clone IS the finished site. npm install && npm run dev.

RUN LOCALLY: npm install, then npm run dev -> http://localhost:5173
BUILD: npm run build  (single-file dist/index.html)
