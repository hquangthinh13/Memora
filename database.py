import cx_Oracle
import hashlib
import os
from datetime import datetime
from flask import session

# Oracle connection setup
def get_connection():
    dsn = cx_Oracle.makedsn(
        os.getenv('DB_HOST', 'localhost'),
        os.getenv('DB_PORT', '1521'),
        service_name=os.getenv('DB_SERVICE', 'orcl21')
    )
    
    conn = cx_Oracle.connect(
        user=os.getenv('DB_USER', 'C##Memora'),
        password=os.getenv('DB_PASSWORD', 'h123'),
        dsn=dsn
    )
    return conn

# User functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username, password):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check if username exists
        cursor.execute("SELECT COUNT(*) FROM USERS WHERE USERNAME = :username", 
                     {'username': username})
        if cursor.fetchone()[0] > 0:
            return False, "Username already exists"
        
        # Get next user_id from sequence
        cursor.execute("SELECT user_id_seq.NEXTVAL FROM DUAL")
        user_id = cursor.fetchone()[0]
        
        # Insert new user
        hashed_password = hash_password(password)
        cursor.execute(
            "INSERT INTO USERS (USERID, USERNAME, PASSWORDHASH) VALUES (:user_id, :username, :password_hash)",
            {'user_id': user_id, 'username': username, 'password_hash': hashed_password}
        )
        conn.commit()
        return True, user_id
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

def verify_user(username, password):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        hashed_password = hash_password(password)
        cursor.execute(
            "SELECT USERID FROM USERS WHERE USERNAME = :username AND PASSWORDHASH = :password_hash",
            {'username': username, 'password_hash': hashed_password}
        )
        result = cursor.fetchone()
        if result:
            return True, result[0]
        return False, "Invalid username or password"
    except Exception as e:
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

# Category functions
def get_user_categories(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT CATID, CATEGORYNAME FROM CATEGORY WHERE USERID = :user_id ORDER BY CATEGORYNAME",
            {'user_id': user_id}
        )
        return cursor.fetchall()
    except Exception as e:
        return []
    finally:
        cursor.close()
        conn.close()

def create_category(user_id, category_name):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check if category exists for this user
        cursor.execute(
            "SELECT COUNT(*) FROM CATEGORY WHERE USERID = :user_id AND CATEGORYNAME = :category_name",
            {'user_id': user_id, 'category_name': category_name}
        )
        if cursor.fetchone()[0] > 0:
            return False, "Category already exists"
        
        # Get next category_id from sequence
        cursor.execute("SELECT category_id_seq.NEXTVAL FROM DUAL")
        cat_id = cursor.fetchone()[0]
        
        # Insert new category
        cursor.execute(
            "INSERT INTO CATEGORY (CATID, USERID, CATEGORYNAME) VALUES (:cat_id, :user_id, :category_name)",
            {'cat_id': cat_id, 'user_id': user_id, 'category_name': category_name}
        )
        conn.commit()
        return True, cat_id
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

# Flashcard functions
def create_flashcard(user_id, cat_id, vocab_word, word_type, meaning, example, word_level):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Get next card_id from sequence
        cursor.execute("SELECT card_id_seq.NEXTVAL FROM DUAL")
        card_id = cursor.fetchone()[0]
        
        # Insert new flashcard
        cursor.execute(
            """INSERT INTO FLASHCARD 
               (CARDID, USERID, CATID, VOCABWORD, WORDTYPE, MEANING, EXAMPLE, LASTUPDATETIME, WORDLEVEL) 
               VALUES (:card_id, :user_id, :cat_id, :vocab_word, :word_type, :meaning, :example, 
                       SYSTIMESTAMP, :word_level)""",
            {
                'card_id': card_id, 
                'user_id': user_id, 
                'cat_id': cat_id,
                'vocab_word': vocab_word, 
                'word_type': word_type, 
                'meaning': meaning,
                'example': example if example else None,  # Handle empty example
                'word_level': word_level
            }
        )
        conn.commit()
        return True, card_id
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

def get_user_flashcards(user_id, category_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        if category_id:
            cursor.execute(
                """SELECT f.CARDID, f.VOCABWORD, f.WORDTYPE, f.MEANING, f.EXAMPLE, f.WORDLEVEL, 
                   c.CATEGORYNAME, f.CATID, TO_CHAR(f.LASTUPDATETIME, 'YYYY-MM-DD HH24:MI:SS') as UPDATETIME
                   FROM FLASHCARD f 
                   JOIN CATEGORY c ON f.CATID = c.CATID
                   WHERE f.USERID = :user_id AND f.CATID = :category_id
                   ORDER BY f.VOCABWORD""",
                {'user_id': user_id, 'category_id': category_id}
            )
        else:
            cursor.execute(
                """SELECT f.CARDID, f.VOCABWORD, f.WORDTYPE, f.MEANING, f.EXAMPLE, f.WORDLEVEL, 
                   c.CATEGORYNAME, f.CATID, TO_CHAR(f.LASTUPDATETIME, 'YYYY-MM-DD HH24:MI:SS') as UPDATETIME
                   FROM FLASHCARD f 
                   JOIN CATEGORY c ON f.CATID = c.CATID
                   WHERE f.USERID = :user_id
                   ORDER BY c.CATEGORYNAME, f.VOCABWORD""",
                {'user_id': user_id}
            )
        
        columns = [col[0].lower() for col in cursor.description]
        result = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return result
    except Exception as e:
        print(f"Error fetching flashcards: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def update_flashcard(card_id, user_id, vocab_word, word_type, meaning, example, word_level, category_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """UPDATE FLASHCARD 
               SET VOCABWORD = :vocab_word, 
                   WORDTYPE = :word_type, 
                   MEANING = :meaning, 
                   EXAMPLE = :example, 
                   WORDLEVEL = :word_level, 
                   CATID = :category_id,
                   LASTUPDATETIME = SYSTIMESTAMP
               WHERE CARDID = :card_id AND USERID = :user_id""",
            {
                'vocab_word': vocab_word, 
                'word_type': word_type, 
                'meaning': meaning,
                'example': example if example else None,  # Handle empty example
                'word_level': word_level,
                'category_id': category_id,
                'card_id': card_id,
                'user_id': user_id
            }
        )
        conn.commit()
        return True, "Flashcard updated successfully"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

def delete_flashcard(card_id, user_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print(f"Executing delete query for card_id: {card_id}, user_id: {user_id}")
        cursor.execute(
            "DELETE FROM FLASHCARD WHERE CARDID = :card_id AND USERID = :user_id",
            {'card_id': card_id, 'user_id': user_id}
        )
        
        rows_deleted = cursor.rowcount
        print(f"Rows deleted: {rows_deleted}")
        conn.commit()
        
        if rows_deleted > 0:
            return True, "Flashcard deleted successfully"
        else:
            return False, "Flashcard not found or you don't have permission to delete it"
    except Exception as e:
        conn.rollback()
        print(f"Exception while deleting flashcard: {str(e)}")
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

def delete_category(cat_id, user_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # First, check if the category belongs to the user
        cursor.execute(
            "SELECT COUNT(*) FROM CATEGORY WHERE CATID = :cat_id AND USERID = :user_id",
            {'cat_id': cat_id, 'user_id': user_id}
        )
        if cursor.fetchone()[0] == 0:
            return False, "Category not found or you don't have permission to delete it"
        
        # Delete associated flashcards first
        cursor.execute(
            "DELETE FROM FLASHCARD WHERE CATID = :cat_id AND USERID = :user_id",
            {'cat_id': cat_id, 'user_id': user_id}
        )
        flashcards_deleted = cursor.rowcount
        print(f"Deleted {flashcards_deleted} flashcards for category {cat_id}")
        
        # Then delete the category
        cursor.execute(
            "DELETE FROM CATEGORY WHERE CATID = :cat_id AND USERID = :user_id",
            {'cat_id': cat_id, 'user_id': user_id}
        )
        category_deleted = cursor.rowcount
        print(f"Deleted category {cat_id}: {category_deleted} rows affected")
        
        conn.commit()
        return True, f"Category and {flashcards_deleted} flashcards deleted successfully"
    except Exception as e:
        conn.rollback()
        print(f"Error in delete_category: {str(e)}")
        return False, str(e)
    finally:
        cursor.close()
        conn.close()

# Update get_user_categories to include flashcard count
def get_user_categories(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT CATID, CATEGORYNAME, FLASHCARDCOUNT FROM CATEGORY WHERE USERID = :user_id ORDER BY CATEGORYNAME",
            {'user_id': user_id}
        )
        categories = cursor.fetchall()
        print(f"Retrieved {len(categories)} categories for user {user_id}")
        return categories
    except Exception as e:
        print(f"Error in get_user_categories: {str(e)}")
        return []
    finally:
        cursor.close()
        conn.close()