import csv
import mysql.connector
import os
from pathlib import Path

MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = "914695"   # <---- यहाँ अपना password डाल
MYSQL_DB = "coding_game"

BASE_DIR = r"C:\Users\Harsh Mishra\Desktop\coding game\db"
PROBLEMS_CSV = os.path.join(BASE_DIR, "problems.csv")
TESTCASES_CSV = os.path.join(BASE_DIR, "test_cases.csv")
SOLUTIONS_CSV = os.path.join(BASE_DIR, "solutions.csv")

def connect(db=None):
    cfg = dict(host=MYSQL_HOST, user=MYSQL_USER,
               password=MYSQL_PASSWORD, charset="utf8mb4")
    if db:
        cfg["database"] = db
    return mysql.connector.connect(**cfg)

def create_db_tables():
    con = connect()
    cur = con.cursor()
    cur.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB} CHARACTER SET utf8mb4;")
    cur.execute(f"USE {MYSQL_DB};")
    cur.execute("SET FOREIGN_KEY_CHECKS=0;")
    for t in ["submissions","room_members","rooms","solutions","test_cases","problems"]:
        cur.execute(f"DROP TABLE IF EXISTS {t};")
    cur.execute("SET FOREIGN_KEY_CHECKS=1;")
    cur.execute("""CREATE TABLE problems(
        id INT PRIMARY KEY,
        slug VARCHAR(255),
        title VARCHAR(255),
        difficulty VARCHAR(50),
        content LONGTEXT)""")
    cur.execute("""CREATE TABLE test_cases(
        id INT AUTO_INCREMENT PRIMARY KEY,
        problem_id INT,
        input LONGTEXT,
        expected_output LONGTEXT,
        FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE)""")
    cur.execute("""CREATE TABLE solutions(
        id INT AUTO_INCREMENT PRIMARY KEY,
        problem_id INT,
        language VARCHAR(30),
        code LONGTEXT,
        FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE)""")
    con.commit()
    cur.close(); con.close()
    print("✅ Database & tables created.")

def import_csv(table, csvfile, query, convert):
    con = connect(MYSQL_DB)
    cur = con.cursor()
    if not Path(csvfile).exists():
        print(f"❌ Missing file: {csvfile}"); return
    with open(csvfile, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = [convert(r) for r in reader if convert(r)]
    cur.executemany(query, rows)
    con.commit()
    cur.close(); con.close()
    print(f"✅ Inserted {len(rows)} rows into {table}")

def import_all():
    create_db_tables()
    import_csv("problems", PROBLEMS_CSV,
        "INSERT INTO problems (id,slug,title,difficulty,content) VALUES (%s,%s,%s,%s,%s)",
        lambda r:(int(r.get("id",0)), r.get("slug",""), r.get("title",""),
                  r.get("difficulty",""), r.get("content","")))
    import_csv("test_cases", TESTCASES_CSV,
        "INSERT INTO test_cases (problem_id,input,expected_output) VALUES (%s,%s,%s)",
        lambda r:(int(r.get("problem_id",0)), r.get("input",""), r.get("expected_output","")))
    import_csv("solutions", SOLUTIONS_CSV,
        "INSERT INTO solutions (problem_id,language,code) VALUES (%s,%s,%s)",
        lambda r:(int(r.get("problem_id",0)), r.get("language","").lower(), r.get("code","")))
    con = connect(MYSQL_DB); cur = con.cursor()
    for t in ["problems","test_cases","solutions"]:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"{t}: {cur.fetchone()[0]} rows")
    cur.close(); con.close()
    print("🎉 Import finished successfully!")

if __name__ == "__main__":
    import_all()
