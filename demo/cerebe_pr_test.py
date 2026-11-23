"""Deliberately flawed code for a Cerebe Factory pull request test. Do not merge."""
import sqlite3


def find_user(conn: sqlite3.Connection, name: str):
    return conn.execute(f"SELECT * FROM users WHERE name = '{name}'").fetchall()


def average(values):
    return sum(values) / len(values)
