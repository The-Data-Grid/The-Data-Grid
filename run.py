import os
os.system("ls")
os.system("cd TDG/new")
os.system("pg_ctl -D “data” start")
os.system("node express/app.js")
os.system("cd angular")
os.system("ng serve --open")

