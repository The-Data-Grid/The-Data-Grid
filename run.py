import multiprocessing
import os
import time

def runPostgreSQL():
    print("PostgreSQL Server PID: {}".format(os.getpid())) 
    
    #print(os.system("pg_ctl status -D ./PostgreSQL/data"))
    os.system("pg_ctl start -D ./PostgreSQL/data")
    #print(os.system("pg_ctl status -D ./PostgreSQL/data"))
def runExpress():
    print("Express Server PID: {}".format(os.getpid())) 
    os.system("node ./Express/app.js")
def runAngular():
    print("Angular Server PID: {}".format(os.getpid())) 
    os.chdir("./Angular")
    os.system("ng serve --open")

if __name__ == "__main__":
    print("Main PID: {}".format(os.getpid()))
    p1 = multiprocessing.Process(target=runPostgreSQL, args=())
    p2 = multiprocessing.Process(target=runExpress, args=())
    p3 = multiprocessing.Process(target=runAngular, args=())
    p1.start()
    while os.system("pg_ctl status -D ./PostgreSQL/data") == 3:
        time.sleep(1)
    p2.start()
    p3.start()